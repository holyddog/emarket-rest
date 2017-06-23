export const Config = {
    Mongo: {
        Host: '127.0.0.1:27017',
        User: encodeURIComponent('admin'),
        Password: encodeURIComponent('whitedog'),
        DBName: 'emarket-dev',
        AuthSource: 'admin'
    },
    FileDir: '/files'
};