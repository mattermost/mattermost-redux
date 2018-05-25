export function generateUUID() {
    let time = new Date().getTime();
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (x) => {
        const d = (time + (Math.random() * 16)) % 16 | 0;
        time = Math.floor(time / 16);
        return (x === 'x' ? d : ((d & 3) | 8)).toString(16);
    });
    return id;
}

export function setCookie({name, value, exseconds}) {
    if (typeof document === 'undefined') {
        return;
    }
    let expires = '';
    if (exseconds) {
        const d = new Date();
        d.setTime(d.getTime() + (exseconds * 1000));
        expires = `expires=${d.toUTCString()};`;
    }

    document.cookie = `${name}=${value};${expires}domain=.gfycat.com;path=/;`;
}

export function readCookie(name) {
    if (typeof document === 'undefined') {
        return null;
    }
    const cname = `${name}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookie = decodedCookie.split(';');
    for (let i = 0; i < cookie.length; i++) {
        const c = cookie[i].trim();
        if (c.indexOf(cname) === 0) {
            return c.substr(cname.length);
        }
    }
    return null;
}

export function readAll() {
    if (typeof document === 'undefined') {
        return null;
    }
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    return cookies.reduce((map, cookie) => {
        const c = cookie.trim().split('=');
        map[c[0]] = c[1];
        return map;
    }, {});
}

export function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC;domain=.gfycat.com;path=/;';
}

export function deleteAll() {
    document.cookie.split(';').map((cookie) => {
        const name = cookie.trim().split('=')[0];
        deleteCookie(name);
        return null;
    });
}

