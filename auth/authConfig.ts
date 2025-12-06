import { Configuration, PopupRequest } from "@azure/msal-browser";

// Config object to be passed to Msal on creation
export const msalConfig: Configuration = {
    auth: {
        // TODO: Replace with your actual Application (client) ID from Azure Portal
        clientId: "ef514f01-cf98-4fb2-9194-ee979da21555", 
        
        // 'common' allows sign-in from any Microsoft Entra ID tenant AND personal Microsoft accounts (Outlook.com).
        authority: "https://login.microsoftonline.com/common",
        
        // This must match the Redirect URI registered in Azure Portal.
        redirectUri: "http://localhost:5173", 
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
    scopes: [
        "User.Read", 
        "Mail.Read", // Required to read Outlook emails
        "Calendars.Read" // Required to read Calendar
    ]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/messages"
};