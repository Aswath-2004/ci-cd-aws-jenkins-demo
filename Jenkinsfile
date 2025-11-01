pipeline {
    agent any

    environment {
        // ===== ACR DETAILS =====
        ACR_NAME = 'aswathregistry'
        ACR_LOGIN_SERVER = 'aswathregistry.azurecr.io'
        IMAGE_NAME = 'demoapp'

        // ===== AZURE DEPLOYMENT DETAILS =====
        RESOURCE_GROUP = 'jenkins-rg'
        CONTAINER_NAME = 'demoapp-container'
        LOCATION = 'southindia'
        DNS_NAME_LABEL = 'aswath-demoapp2004-final'  // must be globally unique

        // ===== JENKINS CREDENTIALS =====
        CREDS = credentials('azure-acr')   // ACR username/password
        AZURE_SP = credentials('azure-sp') // Azure Service Principal JSON
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "📦 Checking out latest code from GitHub..."
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
                    sh '''
                        echo $PASS | docker login ${ACR_LOGIN_SERVER} -u $USR --password-stdin
                    '''
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
                echo "🚀 Deploying container to Azure..."
                script {
                    sh '''
                        echo "Checking if container already exists..."
                        if az container show --resource-group ${RESOURCE_GROUP} --name ${CONTAINER_NAME} &> /dev/null; then
                            echo "Container exists. Updating image..."
                            az container delete --resource-group ${RESOURCE_GROUP} --name ${CONTAINER_NAME} --yes
                            sleep 10
                        fi

                        echo "Creating new container with latest image..."
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
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
            echo "🌍 Access your app at: http://${DNS_NAME_LABEL}.${LOCATION}.azurecontainer.io"
        }
        failure {
            echo "❌ Deployment failed! Check Jenkins logs for details."
        }
    }
}
