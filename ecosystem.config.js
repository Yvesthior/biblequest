module.exports = {
    apps: [{
        name: 'bible-quiz-app',
        script: 'npm',
        args: 'start',
        env: {
            NODE_ENV: 'production',
            PORT: 3010
        }
    }]
};
