// Retreive from Spotify
var authorisation = "Basic <AUTH_TOKEN>"

// Generates a new access token each time the script is run
function refreshToken() {
    var refresh_token = "<REFRESH_TOKEN>"

    var url = "https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=" + refresh_token
    var options = {
        "method": "post",
        "headers": {
            "Authorization": authorisation
        },
    }
    var response = UrlFetchApp.fetch(url, options);
    var jsonResponse = JSON.parse(response.getContentText());

    // Update Spotify playlist
    updateRecentlyLikedPlaylist(jsonResponse.access_token);
}

function updateRecentlyLikedPlaylist(access_token) {
    var playlist_id = "<PLAYLIST_ID>"

    // Get 'Recently Liked' playlist
    var playlistURL = "https://api.spotify.com/v1/playlists/" + playlist_id
    var playlistOptions = {
        "headers": {
            "Authorization": "Bearer " + access_token
        },
    }
    var playlistReponse = UrlFetchApp.fetch(playlistURL, playlistOptions);

    var playlistJSON = playlistReponse.getContentText();
    var playlistData = JSON.parse(playlistJSON);

    // Generate list of songs in playlist
    var playlistArray = [];
    for (i = 0; i < playlistData.tracks.items.length; i++) {
        playlistArray.push(playlistData.tracks.items[i].track.uri);
    }

    // Get top 30 songs from automatically created 'Liked Songs' playlist
    var likedSongsURL = "https://api.spotify.com/v1/me/tracks?limit=30"
    var likedSongsOptions = {
        "headers": {
            "Authorization": "Bearer " + access_token
        },
    }
    var likedSongsResponse = UrlFetchApp.fetch(likedSongsURL, likedSongsOptions);
    var likedSongsJSON = likedSongsResponse.getContentText();
    var likedSongsData = JSON.parse(likedSongsJSON);

    var likedArray = [];

    for (i = 0; i < likedSongsData.items.length; i++) {
        likedArray.push(likedSongsData.items[i].track.uri);
    }
    // Ordered [Most recent, ... Oldest]

    // Get index of most recent addition to 'Recently Liked' playlist
    var depth;
    for (i = 0; i < 30; i++) {
        for (j = 0; j < 30; j++) {
            if (likedArray[i] == playlistArray[j]) {
                depth = i;
            }
            break;
        }
    }

    // If there are songs to add...
    if (depth > 0) {
        var likedUriString = '';
        var playlistUriArray = [];

        // Generate liked song string and songs to delete list
        for (i = 0; i < depth; i++) {
            likedUriString += likedArray[i] + ',';
            playlistUriArray.push({ "uri": playlistArray[29 - i] });
        }

        // Format deletion payload
        var playlistBody = { "tracks": playlistUriArray }

        var removeSongsUrl = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks";
        var removeSongsOptions = {
            "method": "delete",
            "headers": {
                "Authorization": "Bearer " + access_token
            },
            "payload": JSON.stringify(playlistBody)
        }

        // Remove oldest songs from bottom of playlist
        UrlFetchApp.fetch(removeSongsUrl, removeSongsOptions);

        var addSongsURL = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks?position=0&uris=" + likedUriString;
        var addSongsOptions = {
            "method": "post",
            "headers": {
                "Authorization": "Bearer " + access_token
            }
        }

        // Add new songs to start of playlist
        UrlFetchApp.fetch(addSongsURL, addSongsOptions);
    };
}








