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
        CREDS = credentials('azure-acr')    // your ACR username-password credential ID
        AZURE_CREDS = credentials('azure-sp') // your Azure Service Principal JSON secret
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

        stage('Login & Push to ACR') {
            steps {
                script {
                    sh """
                        echo ${CREDS_PSW} | docker login ${ACR_LOGIN_SERVER} -u ${CREDS_USR} --password-stdin
                        docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Login to Azure') {
            steps {
                script {
                    // write service principal JSON to a temp file and login
                    writeFile file: 'azure_sp.json', text: "${AZURE_CREDS}"
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
                    // deploy or update container instance
                    sh '''
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
                          --restart-policy Always || \
                        az container restart --resource-group ${RESOURCE_GROUP} --name ${CONTAINER_NAME}
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful! Access your app at: http://${DNS_NAME_LABEL}.${LOCATION}.azurecontainer.io"
        }
        failure {
            echo "❌ Deployment failed! Check Jenkins logs for errors."
        }
    }
}
