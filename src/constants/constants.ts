export const CONSTANTS = {
    API: {
        AUTHENTICATE: {
            LOGIN: '/api/Auth/login',
            REGISTER: '/api/Auth/register',
            AUTHENTICATE: '/api/Auth/authenticate',
            VERIFY_EMAIL: '/api/Auth/verifyEmail',
            RESEND_EMAIL: '/api/Auth/resendEmail'
        },
        USER: {
            GET_ACTIVE_BROWSERS: '/api/User/getActiveBrowsers',
            GET_CONTACTS: '/api/User/getContacts',
            SEND_CONTACT_REQUEST: '/api/User/addContact',
            GET_REQUEST_ID: '/api/User/getRequestId',
            DELETE_PUBLIC_KEY: '/api/User/deletePublicKey'
        },
        GROUP: {
            CREATE_GROUP: '/api/Group/createGroup',
            GET_GROUPS: '/api/Group/getGroups'
        }
    }
} 