pipeline {
    agent any

    environment {
        ACR_NAME           = 'aswathregistry'
        ACR_LOGIN_SERVER   = 'aswathregistry.azurecr.io'
        IMAGE_NAME         = 'demoapp'
        RESOURCE_GROUP     = 'jenkins-rg'
        CONTAINER_NAME     = 'demoapp-container'
        DNS_NAME_LABEL     = 'aswath-demoapp2004-v7'
        LOCATION           = 'southindia'
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo '🔹 Checking out latest code from GitHub...'
                git branch: 'main', url: 'https://github.com/Aswath-2004/ci-cd-aws-jenkins-demo.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                sh "docker build -t ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest ."
            }
        }

        stage('Login to Azure Container Registry') {
            steps {
                echo '🔐 Logging in to Azure Container Registry...'
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh 'echo $PASS | docker login ${ACR_LOGIN_SERVER} -u $USER --password-stdin'
                }
            }
        }

        stage('Push Image to ACR') {
            steps {
                echo '🚀 Pushing Docker image to Azure Container Registry...'
                sh "docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy to Azure Container Instance') {
            steps {
                echo '🌐 Deploying latest image to Azure Container Instance...'
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh '''
                        echo "➡️ Deleting old container (if exists)..."
                        az container delete --name ${CONTAINER_NAME} --resource-group ${RESOURCE_GROUP} --yes || true
                        
                        echo "🚢 Creating new container from latest image..."
                        az container create \
                            --resource-group ${RESOURCE_GROUP} \
                            --name ${CONTAINER_NAME} \
                            --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest \
                            --cpu 1 --memory 1 \
                            --os-type Linux \
                            --registry-login-server ${ACR_LOGIN_SERVER} \
                            --registry-username $USER \
                            --registry-password $PASS \
                            --dns-name-label ${DNS_NAME_LABEL} \
                            --ports 80 \
                            --location ${LOCATION}
                        
                        echo "✅ Deployment complete!"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Build, push, and deploy pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed — check Jenkins logs for details."
        }
    }
}
