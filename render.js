const fetchUserDetails = (userID,callback) => {
    console.log("Fetching user details");
    setTimeout(() => {
        callback("https://image.example.com/${userID}");
    }, 500)
};

const downloadImage = (imageURL, callback) => {
    console.log("Downloading image");
    setTimeout(() => {
        callback("Image data for ${imageURL}");
    },500)
};

const render = (image) => {
    console.log("Render Image");
};

fetchUserDetails("Hasika", (imageURL) => {
    downloadImage(imageURL, (imageData) => {
        render(imageData);
    })
} )