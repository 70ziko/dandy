# dandy

To run this script in the browser locally, you need to set up a development environment. Here are the steps:

1. **Install Node.js and npm**: If you haven't already, download and install Node.js from [nodejs.org](https://nodejs.org/). This will also install npm (Node Package Manager).

2. **Initialize a new project**: Open a terminal and navigate to your project directory. Run the following command to initialize a new Node.js project:
    ```sh
    npm init -y
    ```

3. **Install necessary dependencies**: You need to install React, ReactDOM, and Three.js. Run the following command:
    ```sh
    npm install react react-dom three
    ```

4. **Set up a development server**: You can use a tool like `create-react-app` to quickly set up a React development environment. Run the following command:
    ```sh
    npx create-react-app my-app
    cd my-app
    ```

5. **Replace the default code**: Replace the contents of `src/App.js` with your `CardGame` component code. Also, ensure you have the necessary imports at the top of the file:
    ```javascript
    import React from 'react';
    import CardGame from './CardGame'; // Adjust the path if necessary

    function App() {
      return (
        <div className="App">
          <CardGame numCards={5} />
        </div>
      );
    }

    export default App;
    ```

6. **Create the `CardGame` component**: Create a new file `src/CardGame.js` and paste your `CardGame` component code into it.

7. **Start the development server**: Run the following command to start the development server:
    ```sh
    npm start
    ```

8. **Open the browser**: Open your browser and navigate to `http://localhost:3000`. You should see your `CardGame` component running.

Make sure you have a placeholder image available at `/api/placeholder/200/280` or update the texture loader URL to point to a valid image URL.
