pipeline {
    agent any

    environment {
        ACR_NAME = 'aswathregistry'
        IMAGE_NAME = 'demoapp'
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        LOCATION = 'southindia'
        DNS_LABEL = 'aswath-demoapp2004-v7'
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Aswath-2004/ci-cd-aws-jenkins-demo.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh '''
                        echo "🧱 Building Docker image..."
                        docker build -t $ACR_NAME.azurecr.io/$IMAGE_NAME:latest .
                    '''
                }
            }
        }

        stage('Push to Azure Container Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials',
                                                 usernameVariable: 'ACR_USER',
                                                 passwordVariable: 'ACR_PASS')]) {
                    script {
                        sh '''
                            echo "🔐 Logging in to ACR..."
                            echo $ACR_PASS | docker login $ACR_NAME.azurecr.io -u $ACR_USER --password-stdin

                            echo "📦 Pushing image to ACR..."
                            docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:latest
                        '''
                    }
                }
            }
        }

        stage('Login to Azure using Service Principal') {
            steps {
                withCredentials([file(credentialsId: 'azure-sp', variable: 'AZURE_SP_FILE')]) {
                    script {
                        sh '''
                            echo "🔑 Logging into Azure..."
                            CLIENT_ID=$(jq -r .clientId $AZURE_SP_FILE)
                            CLIENT_SECRET=$(jq -r .clientSecret $AZURE_SP_FILE)
                            TENANT_ID=$(jq -r .tenantId $AZURE_SP_FILE)
                            SUBSCRIPTION_ID=$(jq -r .subscriptionId $AZURE_SP_FILE)

                            az login --service-principal \
                                --username "$CLIENT_ID" \
                                --password "$CLIENT_SECRET" \
                                --tenant "$TENANT_ID"

                            az account set --subscription "$SUBSCRIPTION_ID"
                        '''
                    }
                }
            }
        }

        stage('Deploy to Azure Container Instance') {
            steps {
                script {
                    sh '''
                        echo "🚀 Deploying container instance..."
                        az container create \
                            --resource-group $RESOURCE_GROUP \
                            --name $CONTAINER_NAME \
                            --image $ACR_NAME.azurecr.io/$IMAGE_NAME:latest \
                            --cpu 1 \
                            --memory 1 \
                            --registry-login-server $ACR_NAME.azurecr.io \
                            --registry-username $ACR_NAME \
                            --registry-password $ACR_PASS \
                            --dns-name-label $DNS_LABEL \
                            --ports 80 \
                            --location $LOCATION \
                            --ip-address Public \
                            --restart-policy Always \
                            --os-type Linux
                    '''
                }
            }
        }
    }

    post {
        success {
            script {
                sh '''
                    echo "🌐 Fetching deployed container details..."
                    az container show \
                        --resource-group $RESOURCE_GROUP \
                        --name $CONTAINER_NAME \
                        --query "{FQDN:ipAddress.fqdn}" -o tsv
                '''
            }
            echo "✅ Deployment successful! 🎉"
        }
        failure {
            echo "❌ Deployment failed! Check Jenkins logs for details."
        }
    }
}
