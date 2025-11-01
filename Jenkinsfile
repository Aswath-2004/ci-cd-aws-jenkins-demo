pipeline {
    agent any

    environment {
        ACR_NAME = 'aswathregistry'
        ACR_LOGIN_SERVER = 'aswathregistry.azurecr.io'
        IMAGE_NAME = 'demoapp'
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        DNS_NAME_LABEL = 'aswath-demoapp2004-v7'
        LOCATION = 'southindia'
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

        stage('Login to ACR') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh "docker login ${ACR_LOGIN_SERVER} -u ${USER} -p ${PASS}"
                }
            }
        }

        stage('Push to ACR') {
            steps {
                script {
                    sh "docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Deploy to Azure') {
            steps {
                withCredentials([string(credentialsId: 'azure-service-principal', variable: 'AZURE_CREDENTIALS')]) {
                    script {
                        echo 'Deploying latest image to Azure Container Instance...'

                        // Write JSON to file
                        writeFile file: 'azureAuth.json', text: "${AZURE_CREDENTIALS}"

                        // Azure CLI Login and Deploy
                        sh '''
                        az login --service-principal -u $(jq -r .clientId azureAuth.json) \
                                 -p $(jq -r .clientSecret azureAuth.json) \
                                 --tenant $(jq -r .tenantId azureAuth.json)

                        az account set --subscription $(jq -r .subscriptionId azureAuth.json)

                        az container delete --name ${CONTAINER_NAME} --resource-group ${RESOURCE_GROUP} --yes || true

                        az container create \
                            --resource-group ${RESOURCE_GROUP} \
                            --name ${CONTAINER_NAME} \
                            --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest \
                            --cpu 1 --memory 1 \
                            --os-type Linux \
                            --registry-login-server ${ACR_LOGIN_SERVER} \
                            --registry-username ${ACR_NAME} \
                            --registry-password $(jq -r .clientSecret azureAuth.json) \
                            --dns-name-label ${DNS_NAME_LABEL} \
                            --ports 80 \
                            --location ${LOCATION}
                        '''
                    }
                }
            }
        }
    }
}
