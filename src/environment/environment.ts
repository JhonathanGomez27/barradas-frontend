// const host = 'http://localhost:3000';
// const hostUrl = 'http://localhost:4200';
// const socketUrl = 'http://localhost:3000/web-rtc';
const host = 'https://www.confiabarradas.com';
const hostUrl = 'https://app.confiabarradas.com';
const socketUrl = 'https://www.confiabarradas.com/web-rtc';

export const environment = {
    host: `${host}`,
    url: `${host}/api`,
    socketUrl: `${socketUrl}`,
    hostComplete: `${hostUrl}/complete`,
    pagination: 20,
    production: false,
}
