export const Config = {
    Mongo: {
        Host: 'localhost:27017',
        // User: encodeURIComponent('root'),
        // Password: encodeURIComponent('K2728123'),
        User: encodeURIComponent('admin'),
        Password: encodeURIComponent('whitedog'),
        DBName: 'emarket-dev',
        AuthSource: 'admin'
    },
    Host: 'http://localhost',
    Port: 3000,
    FileDir: '/files',
    PreloadUrl: 'http://dpinf.thailandpost.com/pltest/plapi',
    PreloadKey: '37ACF1F3E5EA28C7E0531E63FE0AAB61',

    Version: {
        base: 0,
        major: 5,
        minor: 0
    }
};