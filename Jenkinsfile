pipeline {
    agent any

    environment {
        ACR_NAME = "aswathregistry"
        IMAGE_NAME = "demoapp"
        RESOURCE_GROUP = "jenkins-rg"
        ACI_NAME = "demoapp-container"
        LOCATION = "eastus"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/Aswath-2004/ci-cd-aws-jenkins-demo.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push to Azure Container Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASS')]) {
                    script {
                        sh """
                            echo $ACR_PASS | docker login ${ACR_NAME}.azurecr.io -u $ACR_USER --password-stdin
                            docker push ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }

        stage('Login to Azure using Service Principal') {
            steps {
                withCredentials([file(credentialsId: 'azure-sp', variable: 'AZURE_SP_FILE')]) {
                    script {
                        sh """
                            echo "🔑 Logging into Azure..."
                            cat $AZURE_SP_FILE | jq -r '.clientId, .clientSecret, .tenantId, .subscriptionId' | {
                                read CLIENT_ID
                                read CLIENT_SECRET
                                read TENANT_ID
                                read SUBSCRIPTION_ID
                                az login --service-principal --username "$CLIENT_ID" --password "$CLIENT_SECRET" --tenant "$TENANT_ID"
                                az account set --subscription "$SUBSCRIPTION_ID"
                            }
                        """
                    }
                }
            }
        }

        stage('Deploy to Azure Container Instance') {
            steps {
                script {
                    sh """
                        echo "🚀 Deploying container to Azure..."
                        az container create \
                            --resource-group ${RESOURCE_GROUP} \
                            --name ${ACI_NAME} \
                            --image ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest \
                            --cpu 1 \
                            --memory 1 \
                            --registry-login-server ${ACR_NAME}.azurecr.io \
                            --registry-username ${ACR_NAME} \
                            --registry-password $ACR_PASS \
                            --dns-name-label demoapp-${BUILD_NUMBER} \
                            --ports 80 \
                            --location ${LOCATION} \
                            --restart-policy Always --query ipAddress.fqdn
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed! Check Jenkins logs for details."
        }
    }
}
