pipeline {
    agent any

    environment {
        // ----- ACR Configuration -----
        ACR_NAME = 'aswathregistry'
        ACR_LOGIN_SERVER = 'aswathregistry.azurecr.io'
        IMAGE_NAME = 'demoapp'

        // ----- Azure Configuration -----
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        LOCATION = 'southindia'
        DNS_NAME_LABEL = 'aswath-demoapp2004-final'

        // ----- Jenkins Credentials -----
        CREDS = credentials('azure-acr')     // ACR username/password stored in Jenkins
        AZURE_SP = credentials('azure-sp')   // Azure Service Principal JSON stored in Jenkins
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "📥 Checking out source code..."
                git branch: 'main', url: 'https://github.com/Aswath-2004/ci-cd-aws-jenkins-demo.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                sh "docker build -t ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest ."
            }
        }

        stage('Login to ACR') {
            steps {
                echo "🔐 Logging into Azure Container Registry..."
                withCredentials([usernamePassword(credentialsId: 'azure-acr', usernameVariable: 'USR', passwordVariable: 'PASS')]) {
                    sh """
                        echo \$PASS | docker login ${ACR_LOGIN_SERVER} -u \$USR --password-stdin
                    """
                }
            }
        }

        stage('Push Docker Image to ACR') {
            steps {
                echo "📤 Pushing Docker image to ACR..."
                sh "docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest"
            }
        }

        stage('Login to Azure using Service Principal') {
            steps {
                echo "🔑 Logging into Azure..."
                script {
                    // Write service principal JSON to a temporary file
                    writeFile file: 'azure_sp.json', text: "${AZURE_SP}"

                    // Login to Azure
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
                echo "🚀 Deploying container to Azure..."
                script {
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
            echo "✅ Deployment successful!"
            echo "🌐 Your app is live at: http://${DNS_NAME_LABEL}.${LOCATION}.azurecontainer.io"
        }
        failure {
            echo "❌ Deployment failed! Check the Jenkins console logs for details."
        }
    }
}
