module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        cssmin: {
            minify: {
                expand: true,
                cwd: 'css/',
                src: ['*.css', '!*.min.css'],
                dest: 'css/',
                ext: '.min.css'
            }
        },
        uglify: {
            target : {
                expand: true,
                cwd: 'js/',
                src: 'script.js',
                dest: 'js/',
                ext: '.min.js'
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'js/script.js']
        },
        watch: {
            scripts: {
                files: '**/*.js',
                tasks: 'jshint',
                options: {
                    livereload: true,
                }
            },
            css: {
                files: '**/*.scss',
                tasks: 'sass',
                options: {
                    livereload: true,
                }
            },
        },
        sass: {
            build: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'style/master.css': 'style/sass/master.scss'
                }
            }
        }
    });

    grunt.registerTask('default', 'concat');
};