pipeline {
    agent any

    environment {
        // ACR & Azure Config
        ACR_NAME = 'aswathregistry'
        ACR_LOGIN_SERVER = 'aswathregistry.azurecr.io'
        IMAGE_NAME = 'demoapp'
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        LOCATION = 'southindia'
        DNS_NAME_LABEL = 'aswath-demoapp2004-v7'
        PORT = '80'

        // Jenkins credentials
        CREDS = credentials('azure-acr')      // ACR username/password
        AZURE_SP = credentials('azure-sp')    // Azure Service Principal JSON
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
                    sh "docker build -t ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push to Azure Container Registry') {
            steps {
                script {
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

        stage('Deploy to Azure Container Instance') {
            steps {
                script {
                    sh """
                        echo '🚀 Checking if container exists...'
                        if az container show --name ${CONTAINER_NAME} --resource-group ${RESOURCE_GROUP} > /dev/null 2>&1; then
                            echo '🔄 Updating existing container...'
                            az container delete --name ${CONTAINER_NAME} --resource-group ${RESOURCE_GROUP} --yes
                        else
                            echo '🆕 Creating new container...'
                        fi

                        echo '📦 Deploying container to Azure...'
                        az container create \
                            --resource-group ${RESOURCE_GROUP} \
                            --name ${CONTAINER_NAME} \
                            --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest \
                            --cpu 1 \
                            --memory 1 \
                            --registry-login-server ${ACR_LOGIN_SERVER} \
                            --registry-username ${CREDS_USR} \
                            --registry-password ${CREDS_PSW} \
                            --os-type Linux \
                            --restart-policy Always \
                            --dns-name-label ${DNS_NAME_LABEL} \
                            --location ${LOCATION} \
                            --ip-address Public \
                            --ports ${PORT}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
            echo "🌐 Access your app: http://${DNS_NAME_LABEL}.${LOCATION}.azurecontainer.io"
        }
        failure {
            echo "❌ Deployment failed! Check Jenkins logs for details."
        }
    }
}
