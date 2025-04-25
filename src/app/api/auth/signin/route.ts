import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeRegionsCommand } from '@aws-sdk/client-ec2';
import { IAMClient, GetUserCommand } from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

export async function POST(request: Request) {
  try {
    const { accessKeyId, secretAccessKey, region } = await request.json();

    // Create AWS clients with the provided credentials
    const config = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    const s3Client = new S3Client(config);
    const ec2Client = new EC2Client(config);
    const iamClient = new IAMClient(config);
    const stsClient = new STSClient(config);

    // Validate credentials by making multiple service calls
    const [s3Response, ec2Response, iamResponse, stsResponse] = await Promise.all([
      s3Client.send(new ListBucketsCommand({})),
      ec2Client.send(new DescribeRegionsCommand({})),
      iamClient.send(new GetUserCommand({})),
      stsClient.send(new GetCallerIdentityCommand({})),
    ]);

    // If all calls succeed, return success response with user info
    return NextResponse.json({
      success: true,
      user: {
        arn: stsResponse.Arn,
        userId: stsResponse.UserId,
        account: stsResponse.Account,
        region: region,
        s3Buckets: s3Response.Buckets?.length || 0,
        availableRegions: ec2Response.Regions?.length || 0,
        iamUser: iamResponse.User?.UserName,
      },
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Invalid AWS credentials or insufficient permissions' },
      { status: 401 }
    );
  }
} 