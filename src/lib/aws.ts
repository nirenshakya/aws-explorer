import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { ECSClient, ListServicesCommand, DescribeServicesCommand, Service } from '@aws-sdk/client-ecs';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface AWSResource {
  id: string;
  type: string;
  name: string;
  region: string;
  details: Record<string, any>;
}

export async function getAWSClients(credentials: AWSCredentials) {
  console.log(`[AWS] Initializing clients for region: ${credentials.region}`);
  const config = {
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    region: credentials.region,
  };

  return {
    s3: new S3Client(config),
    ec2: new EC2Client(config),
    rds: new RDSClient(config),
    lambda: new LambdaClient(config),
    dynamodb: new DynamoDBClient(config),
    ecs: new ECSClient(config),
  };
}

export async function validateCredentials(credentials: AWSCredentials): Promise<boolean> {
  console.log('[AWS] Validating credentials');
  try {
    const { s3 } = await getAWSClients(credentials);
    await s3.send(new ListBucketsCommand({}));
    console.log('[AWS] Credentials validated successfully');
    return true;
  } catch (error) {
    console.error('[AWS] Credentials validation failed:', error);
    return false;
  }
}

export const searchResources = async (credentials: AWSCredentials, query: string): Promise<AWSResource[]> => {
  console.log(`[AWS] Starting resource search for query: ${query}`);
  const clients = await getAWSClients(credentials);
  const searchQuery = query.toLowerCase();

  const searchS3Buckets = async () => {
    console.log('[AWS] Searching S3 buckets');
    try {
      const command = new ListBucketsCommand({});
      const response = await clients.s3.send(command);
      const buckets = response.Buckets || [];
      const matchingBuckets = buckets
        .filter(bucket => bucket.Name?.toLowerCase().includes(searchQuery))
        .map(bucket => ({
          id: bucket.Name!,
          type: 's3',
          name: bucket.Name!,
          region: credentials.region,
          details: {
            creationDate: bucket.CreationDate,
          },
        }));
      console.log(`[AWS] Found ${matchingBuckets.length} matching S3 buckets`);
      return matchingBuckets;
    } catch (error) {
      console.error('[AWS] Error searching S3 buckets:', error);
      return [];
    }
  };

  const searchEC2Instances = async () => {
    console.log('[AWS] Searching EC2 instances');
    try {
      const command = new DescribeInstancesCommand({});
      const response = await clients.ec2.send(command);
      const instances = response.Reservations?.flatMap(reservation => 
        reservation.Instances || []
      ) || [];
      const matchingInstances = instances
        .filter(instance => 
          instance.InstanceId?.toLowerCase().includes(searchQuery) ||
          instance.Tags?.some(tag => 
            tag.Value?.toLowerCase().includes(searchQuery)
          )
        )
        .map(instance => ({
          id: instance.InstanceId!,
          type: 'ec2',
          name: instance.Tags?.find(tag => tag.Key === 'Name')?.Value || instance.InstanceId!,
          region: credentials.region,
          details: {
            state: instance.State?.Name,
            type: instance.InstanceType,
            launchTime: instance.LaunchTime,
          },
        }));
      console.log(`[AWS] Found ${matchingInstances.length} matching EC2 instances`);
      return matchingInstances;
    } catch (error) {
      console.error('[AWS] Error searching EC2 instances:', error);
      return [];
    }
  };

  const searchRDSInstances = async () => {
    console.log('[AWS] Searching RDS instances');
    try {
      const command = new DescribeDBInstancesCommand({});
      const response = await clients.rds.send(command);
      const instances = response.DBInstances || [];
      const matchingInstances = instances
        .filter(instance => 
          instance.DBInstanceIdentifier?.toLowerCase().includes(searchQuery)
        )
        .map(instance => ({
          id: instance.DBInstanceIdentifier!,
          type: 'rds',
          name: instance.DBInstanceIdentifier!,
          region: credentials.region,
          details: {
            engine: instance.Engine,
            status: instance.DBInstanceStatus,
            endpoint: instance.Endpoint?.Address,
          },
        }));
      console.log(`[AWS] Found ${matchingInstances.length} matching RDS instances`);
      return matchingInstances;
    } catch (error) {
      console.error('[AWS] Error searching RDS instances:', error);
      return [];
    }
  };

  const searchLambdaFunctions = async () => {
    console.log('[AWS] Searching Lambda functions');
    try {
      const command = new ListFunctionsCommand({});
      const response = await clients.lambda.send(command);
      const functions = response.Functions || [];
      const matchingFunctions = functions
        .filter(func => 
          func.FunctionName?.toLowerCase().includes(searchQuery)
        )
        .map(func => ({
          id: func.FunctionName!,
          type: 'lambda',
          name: func.FunctionName!,
          region: credentials.region,
          details: {
            runtime: func.Runtime,
            lastModified: func.LastModified,
            memorySize: func.MemorySize,
          },
        }));
      console.log(`[AWS] Found ${matchingFunctions.length} matching Lambda functions`);
      return matchingFunctions;
    } catch (error) {
      console.error('[AWS] Error searching Lambda functions:', error);
      return [];
    }
  };

  const searchDynamoDBTables = async () => {
    console.log('[AWS] Searching DynamoDB tables');
    try {
      const command = new ListTablesCommand({});
      const response = await clients.dynamodb.send(command);
      const tables = response.TableNames || [];
      const matchingTables = tables
        .filter(table => table.toLowerCase().includes(searchQuery))
        .map(table => ({
          id: table,
          type: 'dynamodb',
          name: table,
          region: credentials.region,
          details: {},
        }));
      console.log(`[AWS] Found ${matchingTables.length} matching DynamoDB tables`);
      return matchingTables;
    } catch (error) {
      console.error('[AWS] Error searching DynamoDB tables:', error);
      return [];
    }
  };

  const searchECSServices = async () => {
    console.log('[AWS] Searching ECS services');
    try {
      // Get all services directly without listing clusters first
      const listServicesCommand = new ListServicesCommand({});
      const servicesResponse = await clients.ecs.send(listServicesCommand);
      const serviceArns = servicesResponse.serviceArns || [];

      if (serviceArns.length > 0) {
        // Get detailed information about the services
        const describeServicesCommand = new DescribeServicesCommand({
          services: serviceArns,
        });
        const servicesDetails = await clients.ecs.send(describeServicesCommand);
        const services = servicesDetails.services || [];

        const matchingServices = services
          .filter((service: Service) => 
            service.serviceName?.toLowerCase().includes(searchQuery) ||
            service.taskDefinition?.toLowerCase().includes(searchQuery)
          )
          .map((service: Service) => ({
            id: service.serviceArn!,
            type: 'ecs',
            name: service.serviceName!,
            region: credentials.region,
            details: {
              cluster: service.clusterArn,
              taskDefinition: service.taskDefinition,
              desiredCount: service.desiredCount,
              runningCount: service.runningCount,
              launchType: service.launchType,
              status: service.status,
            },
          }));
        console.log(`[AWS] Found ${matchingServices.length} matching ECS services`);
        return matchingServices;
      }
      return [];
    } catch (error) {
      console.error('[AWS] Error searching ECS services:', error);
      return [];
    }
  };

  const [
    s3Results,
    ec2Results,
    rdsResults,
    lambdaResults,
    dynamodbResults,
    ecsResults
  ] = await Promise.all([
    searchS3Buckets(),
    searchEC2Instances(),
    searchRDSInstances(),
    searchLambdaFunctions(),
    searchDynamoDBTables(),
    searchECSServices()
  ]);

  const allResults = [
    ...s3Results,
    ...ec2Results,
    ...rdsResults,
    ...lambdaResults,
    ...dynamodbResults,
    ...ecsResults
  ];

  console.log(`[AWS] Total resources found: ${allResults.length}`);
  return allResults;
}; 