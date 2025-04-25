export interface AWSResource {
  id: string;
  name: string;
  type: AWSResourceType;
  region: string;
  description?: string;
}

export type AWSResourceType =
  | 'EC2 Instance'
  | 'S3 Bucket'
  | 'Lambda Function'
  | 'RDS Database'
  | 'DynamoDB Table'
  | 'ECS Cluster'
  | 'VPC'
  | 'Security Group'
  | 'IAM Role'
  | 'CloudFront Distribution';

export interface SearchResult {
  resource: AWSResource;
  matchType: 'name' | 'id' | 'type';
  relevanceScore: number;
} 