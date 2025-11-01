pipeline {
    agent any

    environment {
        ACR_NAME = 'aswathregistry'
        ACR_LOGIN_SERVER = 'aswathregistry.azurecr.io'
        IMAGE_NAME = 'demoapp'
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        LOCATION = 'southindia'
        DNS_NAME_LABEL = 'aswath-demoapp2004-v7'

        // Jenkins credentials
        CREDS = credentials('azure-acr')    // ACR username/password
        AZURE_SP = credentials('azure-sp')  // Azure Service Principal JSON
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
                    echo "🛠️ Building Docker image..."
                    sh "docker build -t ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push Docker Image to ACR') {
            steps {
                script {
                    echo "📤 Pushing image to Azure Container Registry..."
                    sh """
                        echo ${CREDS_PSW} | docker login ${ACR_LOGIN_SERVER} -u ${CREDS_USR} --password-stdin
                        docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Login to Azure using Service Principal') {
            steps {
                script {
                    echo "🔐 Logging into Azure using Service Principal..."
                    writeFile file: 'azure_sp.json', text: "${AZURE_SP}"
                    sh '''
                        az login --service-principal \
                            --username $(jq -r .clientId azure_sp.json) \
                            --password $(jq -r .clientSecret azure_sp.json) \
                            --tenant $(jq -r .tenantId azure_sp.json)

                        az account set --subscription $(jq -r .subscriptionId azure_sp.json)
                    '''
                }
            }
        }

        stage('Deploy or Update Azure Container Instance') {
            steps {
                script {
                    echo "🚀 Deploying or updating Azure Container Instance..."
                    sh '''
                        if az container show --name ${CONTAINER_NAME} --resource-group ${RESOURCE_GROUP} > /dev/null 2>&1; then
                            echo "🔄 Updating existing container..."
                            az container update \
                                --name ${CONTAINER_NAME} \
                                --resource-group ${RESOURCE_GROUP} \
                                --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest
                            az container restart --name ${CONTAINER_NAME} --resource-group ${RESOURCE_GROUP}
                        else
                            echo "🆕 Creating new container..."
                            az container create \
                                --resource-group ${RESOURCE_GROUP} \
                                --name ${CONTAINER_NAME} \
                                --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest \
                                --cpu 1 --memory 1 \
                                --registry-login-server ${ACR_LOGIN_SERVER} \
                                --registry-username ${CREDS_USR} \
                                --registry-password ${CREDS_PSW} \
                                --dns-name-label ${DNS_NAME_LABEL} \
                                --ports 80 \
                                --location ${LOCATION} \
                                --restart-policy Always
                        fi
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
            echo "🌐 Access your app at: http://${DNS_NAME_LABEL}.${LOCATION}.azurecontainer.io"
        }
        failure {
            echo "❌ Deployment failed! Check Jenkins logs for details."
        }
    }
}
