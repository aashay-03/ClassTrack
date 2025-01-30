
# ClassTrack

A web application that records student attendance using facial recognition.

## API Used 
[face-api.js](https://github.com/justadudewhohacks/face-api.js/) - A JavaScript API for face detection and face recognition in the browser.
  
## How to run on your local machine?

- Ensure that Node.js is installed on your system.
- Next, type ```git clone https://github.com/aashay-03/ClassTrack.git``` on your command prompt.
- Create a ```.env``` file inside the cloned folder and add the required environment variables.
- Run ```npm i``` in your terminal.
- Run ```node app.js``` in your terminal.
- The app should now be running on ```localhost:3000```.
- Open a browser and visit ```localhost:3000```.

## Environment Variables

- ```SECRET_KEY```: A random string used for encryption and session management.
- ```MONGO_REMOTE```: Your MongoDB Connection string.
- ```CLOUD_NAME```, ```API_KEY```, and  ```API_SECRET```: Your Cloudinary Cloud name, API Key and API Secret.
- ```COLLEGE_CODE```:  A random string used to verify teachers during signup.
- ```MAIL_USERNAME``` and ```MAIL_PASSWORD```: Email address used to send emails and password for authentication.
- ```OAUTH_CLIENTID```, ```OAUTH_CLIENT_SECRET```, and ```OAUTH_REFRESH_TOKEN```: Your Google OAuth provider Client ID, Client Secret, and Refresh Token.

