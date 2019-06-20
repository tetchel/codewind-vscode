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
        - /usr/local/bin/uid_entrypoint
    args:
        - /usr/bin/env/bash
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
                container("node"){
                    dir('dev') {
                        sh "whoami"
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
