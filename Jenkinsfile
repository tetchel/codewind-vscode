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

    stages {
        stage('Build') {
            steps {
                container("node") {
                    dir('dev') {
                        sh "npm run vscode:prepublish"
                    }
                    stash includes: '**/*', name: 'dev'
                }
            }
        }

        stage('Deploy') {
            steps {
                container("node") {
                    unstash 'dev'

                    sh "npm i -g vsce"
                    dir('dev') {
                        sh 'vsce package && \
                            export artifact_name="$(basename *.vsix)" && \
                            mv -v $artifact_name ..'
                    }
                    sh "ci-scripts/deploy.sh || >&2 echo 'Deploy failed!'"
                }
            }
        }
    }
}
