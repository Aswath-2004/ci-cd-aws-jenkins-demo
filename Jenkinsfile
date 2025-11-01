pipeline {
    agent any

    environment {
        IMAGE_NAME = 'demoapp'
        ACR_NAME = 'aswathregistry'
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        LOCATION = 'southindia'
        DNS_LABEL = 'aswath-demoapp2004-v7'
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
                    sh 'docker build -t ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest .'
                }
            }
        }

        stage('Push to Azure Container Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASS')]) {
                    script {
                        sh """
                        echo \$ACR_PASS | docker login \$ACR_NAME.azurecr.io -u \$ACR_USER --password-stdin
                        docker push \$ACR_NAME.azurecr.io/\$IMAGE_NAME:latest
                        """
                    }
                }
            }
        }

        stage('Login to Azure using Service Principal') {
            steps {
                withCredentials([file(credentialsId: 'azure-sp', variable: 'AZURE_SP_FILE')]) {
                    script {
                        def sp = readJSON file: AZURE_SP_FILE
                        sh """
                        az login --service-principal \
                            -u \${sp.clientId} \
                            -p \${sp.clientSecret} \
                            --tenant \${sp.tenantId}
                        """
                    }
                }
            }
        }

        stage('Deploy to Azure Container Instance') {
            steps {
                script {
                    sh """
                    az container create \
                      --resource-group \$RESOURCE_GROUP \
                      --name \$CONTAINER_NAME \
                      --image \$ACR_NAME.azurecr.io/\$IMAGE_NAME:latest \
                      --cpu 1 --memory 1 \
                      --registry-login-server \$ACR_NAME.azurecr.io \
                      --registry-username \$ACR_NAME \
                      --registry-password "\$(az acr credential show --name \$ACR_NAME --query "passwords[0].value" -o tsv)" \
                      --ports 80 \
                      --os-type Linux \
                      --restart-policy Always \
                      --dns-name-label \$DNS_LABEL \
                      --location \$LOCATION \
                      --ip-address Public --query "{FQDN:ipAddress.fqdn, IP:ipAddress.ip}" -o table || \
                      az container update \
                      --resource-group \$RESOURCE_GROUP \
                      --name \$CONTAINER_NAME \
                      --image \$ACR_NAME.azurecr.io/\$IMAGE_NAME:latest
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful! Your app is live.'
        }
        failure {
            echo '❌ Deployment failed! Check Jenkins logs for details.'
        }
    }
}
