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

        // 🔹 NEW STAGE BELOW: Automatic Azure Redeploy 🔹
        stage('Deploy to Azure') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    script {
                        echo 'Deploying latest image to Azure Container Instance...'
                        sh """
                        az container delete --name ${CONTAINER_NAME} --resource-group ${RESOURCE_GROUP} --yes || true
                        az container create \
                            --resource-group ${RESOURCE_GROUP} \
                            --name ${CONTAINER_NAME} \
                            --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest \
                            --cpu 1 --memory 1 \
                            --os-type Linux \
                            --registry-login-server ${ACR_LOGIN_SERVER} \
                            --registry-username ${USER} \
                            --registry-password ${PASS} \
                            --dns-name-label ${DNS_NAME_LABEL} \
                            --ports 80 \
                            --location ${LOCATION}
                        """
                    }
                }
            }
        }
    }
}
