pipeline {
    agent any

    environment {
        ACR_NAME = 'aswathregistry'
        IMAGE_NAME = 'demoapp'
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        DNS_LABEL = 'aswath-demoapp2004'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git 'https://github.com/Aswath-2004/ci-cd-aws-jenkins-demo'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest .'
            }
        }

        stage('Login to ACR') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'ACR_CREDENTIALS', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    sh 'docker login ${ACR_NAME}.azurecr.io -u ${USER} -p ${PASS}'
                }
            }
        }

        stage('Push to ACR') {
            steps {
                sh 'docker push ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest'
            }
        }

        stage('Deploy to Azure Container') {
            steps {
                sh '''
                    az container create \
                        --resource-group ${RESOURCE_GROUP} \
                        --name ${CONTAINER_NAME} \
                        --image ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest \
                        --cpu 1 --memory 1 \
                        --registry-login-server ${ACR_NAME}.azurecr.io \
                        --registry-username ${USER} \
                        --registry-password ${PASS} \
                        --dns-name-label ${DNS_LABEL} \
                        --ports 3000 \
                        --os-type Linux \
                        --restart-policy Always \
                        --query ipAddress.fqdn -o tsv
                '''
            }
        }
    }
}
