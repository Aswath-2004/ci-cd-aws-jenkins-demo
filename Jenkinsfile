pipeline {
  agent any
  environment {
    AWS_REGION = 'us-east-1' // change this if needed
    ECR_REPO = 'ci-cd-demo-repo'
    AWS_ACCOUNT_ID = '<YOUR_AWS_ACCOUNT_ID>'
    ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Build & Test') {
      steps {
        sh 'npm install'
        sh 'npm test || true'
      }
    }
    stage('Build Docker Image') {
      steps {
        sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} ."
      }
    }
    stage('Login to ECR') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'aws-jenkins-creds', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh """
            aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
            aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
            aws configure set region ${AWS_REGION}
            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
          """
        }
      }
    }
    stage('Tag & Push to ECR') {
      steps {
        sh """
          docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
          docker push ${ECR_URI}:${IMAGE_TAG}
        """
      }
    }
    stage('Deploy') {
      steps {
        sh """
          docker rm -f ci-cd-demo || true
          docker run -d --name ci-cd-demo -p 80:80 ${ECR_URI}:${IMAGE_TAG}
        """
      }
    }
  }
}
