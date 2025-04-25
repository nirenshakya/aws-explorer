import { NextRequest, NextResponse } from 'next/server';
import { getAWSClients } from '@/lib/aws';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const { type, id } = params;
  console.log(`[Service API] Fetching details for ${type} service: ${id}`);
  try {
    const cookieStore = await cookies();
    const credentialsCookie = cookieStore.get('awsCredentials');
    
    if (!credentialsCookie) {
      console.log('[Service API] No stored credentials found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const credentials = JSON.parse(credentialsCookie.value);
    const clients = await getAWSClients(credentials);

    let serviceDetails;
    switch (type) {
      case 's3':
        serviceDetails = await getS3Details(clients.s3, id);
        break;
      case 'ec2':
        serviceDetails = await getEC2Details(clients.ec2, id);
        break;
      case 'rds':
        serviceDetails = await getRDSDetails(clients.rds, id);
        break;
      case 'lambda':
        serviceDetails = await getLambdaDetails(clients.lambda, id);
        break;
      case 'dynamodb':
        serviceDetails = await getDynamoDBDetails(clients.dynamodb, id);
        break;
      case 'ecs':
        serviceDetails = await getECSDetails(clients.ecs, id);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported service type' },
          { status: 400 }
        );
    }

    if (!serviceDetails) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serviceDetails);
  } catch (error) {
    console.error('[Service API] Error fetching service details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service details' },
      { status: 500 }
    );
  }
}

async function getS3Details(s3Client: any, bucketName: string) {
  try {
    const { HeadBucketCommand, GetBucketTaggingCommand, GetBucketLocationCommand } = await import('@aws-sdk/client-s3');
    const [headResponse, tagsResponse, locationResponse] = await Promise.all([
      s3Client.send(new HeadBucketCommand({ Bucket: bucketName })),
      s3Client.send(new GetBucketTaggingCommand({ Bucket: bucketName })).catch(() => ({ TagSet: [] })),
      s3Client.send(new GetBucketLocationCommand({ Bucket: bucketName }))
    ]);

    const region = locationResponse.LocationConstraint || 'us-east-1';

    return {
      id: bucketName,
      type: 's3',
      name: bucketName,
      region,
      details: {
        tags: tagsResponse.TagSet || [],
        location: region,
      },
    };
  } catch (error) {
    console.error('[Service API] Error fetching S3 details:', error);
    return null;
  }
}

async function getEC2Details(ec2Client: any, instanceId: string) {
  try {
    const { DescribeInstancesCommand } = await import('@aws-sdk/client-ec2');
    const response = await ec2Client.send(
      new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      })
    );

    const instance = response.Reservations?.[0]?.Instances?.[0];
    if (!instance) return null;

    return {
      id: instance.InstanceId!,
      type: 'ec2',
      name: instance.Tags?.find((tag: any) => tag.Key === 'Name')?.Value || instance.InstanceId!,
      region: instance.Placement?.AvailabilityZone?.slice(0, -1),
      details: {
        state: instance.State?.Name,
        type: instance.InstanceType,
        launchTime: instance.LaunchTime,
        tags: instance.Tags || [],
        vpcId: instance.VpcId,
        subnetId: instance.SubnetId,
        privateIp: instance.PrivateIpAddress,
        publicIp: instance.PublicIpAddress,
      },
    };
  } catch (error) {
    console.error('[Service API] Error fetching EC2 details:', error);
    return null;
  }
}

async function getRDSDetails(rdsClient: any, instanceId: string) {
  try {
    const { DescribeDBInstancesCommand } = await import('@aws-sdk/client-rds');
    const response = await rdsClient.send(
      new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId,
      })
    );

    const instance = response.DBInstances?.[0];
    if (!instance) return null;

    return {
      id: instance.DBInstanceIdentifier!,
      type: 'rds',
      name: instance.DBInstanceIdentifier!,
      region: instance.AvailabilityZone?.slice(0, -1),
      details: {
        engine: instance.Engine,
        status: instance.DBInstanceStatus,
        endpoint: instance.Endpoint?.Address,
        port: instance.Endpoint?.Port,
        size: instance.DBInstanceClass,
        storage: instance.AllocatedStorage,
        multiAZ: instance.MultiAZ,
        tags: instance.TagList || [],
      },
    };
  } catch (error) {
    console.error('[Service API] Error fetching RDS details:', error);
    return null;
  }
}

async function getLambdaDetails(lambdaClient: any, functionName: string) {
  try {
    const { GetFunctionCommand } = await import('@aws-sdk/client-lambda');
    const response = await lambdaClient.send(
      new GetFunctionCommand({
        FunctionName: functionName,
      })
    );

    const func = response.Configuration;
    if (!func) return null;

    return {
      id: func.FunctionName!,
      type: 'lambda',
      name: func.FunctionName!,
      region: func.FunctionArn!.split(':')[3],
      details: {
        runtime: func.Runtime,
        handler: func.Handler,
        memorySize: func.MemorySize,
        timeout: func.Timeout,
        lastModified: func.LastModified,
        role: func.Role,
        tags: response.Tags || {},
      },
    };
  } catch (error) {
    console.error('[Service API] Error fetching Lambda details:', error);
    return null;
  }
}

async function getDynamoDBDetails(dynamodbClient: any, tableName: string) {
  try {
    const { DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
    const response = await dynamodbClient.send(
      new DescribeTableCommand({
        TableName: tableName,
      })
    );

    const table = response.Table;
    if (!table) return null;

    return {
      id: table.TableName!,
      type: 'dynamodb',
      name: table.TableName!,
      region: table.TableArn!.split(':')[3],
      details: {
        status: table.TableStatus,
        creationDate: table.CreationDateTime,
        itemCount: table.ItemCount,
        sizeBytes: table.TableSizeBytes,
        keySchema: table.KeySchema,
        provisionedThroughput: table.ProvisionedThroughput,
        tags: table.Tags || [],
      },
    };
  } catch (error) {
    console.error('[Service API] Error fetching DynamoDB details:', error);
    return null;
  }
}

async function getECSDetails(ecsClient: any, serviceArn: string) {
  try {
    const { DescribeServicesCommand } = await import('@aws-sdk/client-ecs');
    const response = await ecsClient.send(
      new DescribeServicesCommand({
        services: [serviceArn],
      })
    );

    const service = response.services?.[0];
    if (!service) return null;

    return {
      id: service.serviceArn!,
      type: 'ecs',
      name: service.serviceName!,
      region: service.serviceArn!.split(':')[3],
      details: {
        cluster: service.clusterArn,
        taskDefinition: service.taskDefinition,
        desiredCount: service.desiredCount,
        runningCount: service.runningCount,
        launchType: service.launchType,
        status: service.status,
        events: service.events || [],
        deployments: service.deployments || [],
        tags: service.tags || [],
      },
    };
  } catch (error) {
    console.error('[Service API] Error fetching ECS details:', error);
    return null;
  }
} 