import type { User } from 'firebase/auth';

export async function callHuggingFaceProxy({
    user,
    task,
    data,
    contentType = 'application/json',
    model,
}: {
    user: User;
    task: string;
    data: any; // string | object | ArrayBuffer depending on contentType
    contentType?: string;
    model?: string;
}): Promise<any> {
    const idToken = await user.getIdToken();

    const query = new URLSearchParams({ task });
    if (model) query.set('model', model);

    const response = await fetch(
        `https://<your-region>-<your-project>.cloudfunctions.net/proxyHuggingFace?${query.toString()}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${idToken}`,
                'Content-Type': contentType,
            },
            body:
                contentType === 'application/json'
                    ? JSON.stringify(data)
                    : data,
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Request failed');
    }

    return await response.json();
}
