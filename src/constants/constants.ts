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
            GET_CONTACTS: '/api/User/getContacts',
            SEND_CONTACT_REQUEST: '/api/User/addContact',
            GET_REQUEST_ID: '/api/User/getRequestId',
            DELETE_PUBLIC_KEY: '/api/User/deletePublicKey'
        },
        GROUP: {
            GET_GROUPS: '/api/Group/getGroups'
        }
    }
} 