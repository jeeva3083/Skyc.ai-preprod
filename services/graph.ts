import { graphConfig, loginRequest } from "../auth/authConfig";
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

/**
 * Attaches a given access token to a MS Graph API call. Returns information about the user
 * @param accessToken 
 */
export async function callMsGraph(accessToken: string) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    return fetch(graphConfig.graphMeEndpoint, options)
        .then(response => response.json())
        .catch(error => console.log(error));
}

/**
 * Fetch latest emails from Outlook
 */
export async function fetchOutlookEmails(instance: PublicClientApplication, account: any) {
    try {
        // Silently acquire token
        let response;
        try {
            response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: account
            });
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                // If silent fails (e.g. consent needed), fallback to popup
                response = await instance.acquireTokenPopup({
                    ...loginRequest,
                    account: account
                });
            } else {
                throw error;
            }
        }

        if (!response?.accessToken) throw new Error("No access token acquired");

        const headers = new Headers();
        const bearer = `Bearer ${response.accessToken}`;
        headers.append("Authorization", bearer);

        // Fetch top 5 emails
        const graphResponse = await fetch(`${graphConfig.graphMailEndpoint}?$top=5&$select=subject,from,receivedDateTime,isRead`, {
            method: "GET",
            headers: headers
        });

        const data = await graphResponse.json();
        return data.value || []; // Ensure we return an array even if empty
    } catch (error) {
        console.error("Graph API Error:", error);
        throw error;
    }
}