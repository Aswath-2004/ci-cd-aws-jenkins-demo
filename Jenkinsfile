pipeline {
    agent any

    environment {
        ACR_LOGIN_SERVER = 'aswathregistry.azurecr.io'
        ACR_USER = 'aswathregistry'
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        IMAGE_NAME = 'demoapp'
        LOCATION = 'southindia'
        DNS_NAME_LABEL = 'aswath-demoapp2004-v8'
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
                    echo "🧱 Building Docker image..."
                    env.IMAGE_TAG = "v${env.BUILD_NUMBER}" // unique version tag
                    sh """
                    docker build -t ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} .
                    docker tag ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Push to Azure Container Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASS')]) {
                    script {
                        echo "🔐 Logging in to ACR..."
                        sh """
                        echo ${ACR_PASS} | docker login ${ACR_LOGIN_SERVER} -u ${ACR_USER} --password-stdin
                        echo "📦 Pushing image to ACR..."
                        docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }

        stage('Login to Azure using Service Principal') {
            steps {
                withCredentials([file(credentialsId: 'azure-sp-file', variable: 'AZURE_SP_FILE')]) {
                    script {
                        echo "🔑 Logging into Azure..."
                        sh """
                        CLIENT_ID=$(jq -r .clientId ${AZURE_SP_FILE})
                        CLIENT_SECRET=$(jq -r .clientSecret ${AZURE_SP_FILE})
                        TENANT_ID=$(jq -r .tenantId ${AZURE_SP_FILE})
                        SUBSCRIPTION_ID=$(jq -r .subscriptionId ${AZURE_SP_FILE})
                        az login --service-principal --username $CLIENT_ID --password $CLIENT_SECRET --tenant $TENANT_ID
                        az account set --subscription $SUBSCRIPTION_ID
                        """
                    }
                }
            }
        }

        stage('Deploy to Azure Container Instance') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASS')]) {
                    script {
                        echo "🚀 Deploying container instance..."
                        sh """
                        az container delete --resource-group ${RESOURCE_GROUP} --name ${CONTAINER_NAME} --yes || true
                        az container create \
                            --resource-group ${RESOURCE_GROUP} \
                            --name ${CONTAINER_NAME} \
                            --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} \
                            --cpu 1 --memory 1 \
                            --registry-login-server ${ACR_LOGIN_SERVER} \
                            --registry-username ${ACR_USER} \
                            --registry-password ${ACR_PASS} \
                            --dns-name-label ${DNS_NAME_LABEL} \
                            --ports 80 \
                            --location ${LOCATION} \
                            --ip-address Public \
                            --restart-policy Always \
                            --os-type Linux
                        echo "🌐 Fetching Public IP..."
                        az container show --resource-group ${RESOURCE_GROUP} --name ${CONTAINER_NAME} --query ipAddress.ip --output tsv
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful! Visit your app using the public IP above."
        }
        failure {
            echo "❌ Deployment failed! Check Jenkins logs for details."
        }
    }
}
