# Production Setup Guide

This guide outlines the steps to set up the production environment for the user certificate management system.

## Prerequisites

*   An AWS account
*   AWS CLI installed and configured
*   Terraform installed
*   A domain name (optional, for HTTPS)

## Steps

1.  **Create an S3 Bucket:**

    Create an S3 bucket to store user certificates.  The bucket name should be globally unique.

    \`\`\`bash
    aws s3api create-bucket --bucket user-certificates-bucket --region <your_aws_region> --create-bucket-configuration LocationConstraint=<your_aws_region>
    \`\`\`

    **Important:** Replace `<your_aws_region>` with your desired AWS region (e.g., us-east-1).

2.  **Configure Bucket Policy:**

    Set a bucket policy to allow access to the certificates.  This policy should be restrictive to minimize security risks.  For example:

    \`\`\`json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "AWS": "arn:aws:iam::<your_account_id>:role/<your_application_role>"
          },
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::user-certificates-bucket/*"
        }
      ]
    }
    \`\`\`

    Replace `<your_account_id>` with your AWS account ID and `<your_application_role>` with the ARN of the IAM role used by your application.  Apply this policy using the AWS CLI:

    \`\`\`bash
    aws s3api put-bucket-policy --bucket user-certificates-bucket --policy file://bucket_policy.json
    \`\`\`

3.  **Set up DNS (Optional):**

    If you want to access the certificates via HTTPS using a custom domain name, configure your DNS records to point to the S3 bucket.  This typically involves creating a CNAME record that points to the S3 bucket's endpoint.  You will also need to configure an SSL certificate for your domain.  Consider using AWS Certificate Manager (ACM) for this.

4.  **Configure Application:**

    Update your application's configuration to point to the S3 bucket.  This typically involves setting environment variables or configuration parameters with the bucket name and region.

    *   **Bucket Name:** `user-certificates-bucket`
    *   **AWS Region:** `<your_aws_region>`

    Your application should use the AWS SDK to interact with the S3 bucket.  Ensure that the application has the necessary IAM permissions to access the bucket (as defined in the bucket policy).

5.  **Deployment:**

    Deploy your application to your production environment.  Ensure that all dependencies are installed and configured correctly.

## Security Considerations

*   **Bucket Policy:**  Carefully review and restrict the bucket policy to minimize the risk of unauthorized access.
*   **IAM Roles:**  Use IAM roles with the principle of least privilege to grant access to the S3 bucket.
*   **Encryption:**  Consider enabling server-side encryption for the S3 bucket to protect the certificates at rest.
*   **HTTPS:**  Always use HTTPS to access the certificates to protect them in transit.

## Troubleshooting

*   **Access Denied Errors:**  Check the bucket policy and IAM roles to ensure that the application has the necessary permissions.
*   **Bucket Not Found Errors:**  Verify that the bucket name is correct and that the AWS region is configured correctly.
