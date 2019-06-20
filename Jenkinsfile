#!groovy​

pipeline {
    agent {
		kubernetes {
      		label 'node'
			yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:lts
    tty: true
    command:
      - cat
"""
    	}
	}

	options {
        timestamps()
        skipStagesAfterUnstable()
    }

    environment {
        // https://stackoverflow.com/a/43264045
        HOME="."
    }

    stages {
        stage('Build') {
            steps {
                container("node") {
                    dir('dev') {
                        sh "npm run vscode:prepublish"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                container("node") {
                    dir('dev') {
                        sh '''
                            npm i vsce
                            npx vsce package
                            export artifact_name="$(basename *.vsix)"
                            mv -v $artifact_name ..
                        '''
                    }
                    sh "ci-scripts/deploy.sh || >&2 echo 'Deploy failed!'"
                }
            }
        }
    }
}
