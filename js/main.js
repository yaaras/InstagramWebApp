$(document).ready(function() {

    // Add all cat images from json file
    getPictures();

    // Get all pictures from JSON
    function getPictures() {

        // empty all posts 
        $(".cats").empty();

        // Get pictures from server
        $.ajax({
            url: "http://localhost:8008/",
            type: "GET",
            datatype: "json",
            headers: {
                "Content-Type": "application/json"
            },
            success: function(response) {
                // Write all posts to page
                $.each(response, function(key, val) {
                    writeImage(val);
                });
            }
        });

        // Old Method - Get data from json without Server
        // $.getJSON("/cats.json", function(data) {
        //     $.each(data, function(key, val) {
        //         writeImage(val);
        //     });
        // });
    }

    // Write comment to page
    function writeComment(comment, img) {
        var cmt = $(".templates .comment").clone();
        var section = img.find('.card-body').find('.commentSection');

        cmt.find(".username").html(comment.username);
        cmt.find(".message").html(comment.message);
        cmt.find(".avatar").attr("src", comment.avatar);

        $(section).append(cmt);
    }

    // Write image to page
    function writeImage(item) {
        var img = $(".templates .catImage").clone();

        img.find(".imgIndex").html(item.index);
        img.find(".username").html(item.username);
        img.find(".avatar").attr("src", item.avatar);
        img.find(".picture").attr("src", item.picture);
        img.find(".likeCount").html(item.likes);
        img.find(".location").html(item.location);

        // Write Description
        var desc = {
            "username": item.username,
            "avatar": item.avatar,
            "message": item.description
        };
        writeComment(desc, img);

        // Write Comments
        $.each(item.comments, function(key, val) {
            writeComment(val, img);
        });


        // LOCAL STORAGE: Copy 'like' state from local storage
        // if doesnt exist - create new key/value pair
        var likeButton = img.find(".fa-heart")[0];
        if (localStorage["_img" + item.index] == 1) {
            $(likeButton).removeClass("far").addClass("fas");
        }

        $(".cats").append(img);
    }

    // Handle Change Background Event
    $(".img-item").click(function(event) {
        var newBg = "url(" + event.target.src + ")";
        $("body").css("background-image", newBg);
    });

    // Handle 'Like' Button Click Event
    $(document).on("click", ".fa-heart", function(event) {
        $(this).toggleClass("far fas"); // far = not liked; fas = liked

        // Get number of likes
        var likes = $(event.target).closest('.card-body')
            .find('.likeCount')[0]
            .innerText;
        likes = parseInt(likes);

        var index = $(event.target).closest('.card')
            .find('.imgIndex')[0]
            .innerText;

        // Add one to number of likes (Picture Liked)
        if ($(this).hasClass('fas')) {
            likes += 1;
            // Update local storage
            localStorage["_img" + index] = 1;
        }
        // Subtract one from number of likes (Picture Unliked)
        else {
            likes -= 1;
            // Update local storage
            localStorage["_img" + index] = 0;
        }
        $(event.target).closest('.card-body')
            .find('.likeCount')
            .text(likes);

        // Update number of likes
        $.ajax({
            url: "http://localhost:8008/like",
            type: "POST",
            datatype: "json",
            data: JSON.stringify({
                'index': index,
                'likes': likes
            }),
            headers: {
                "Content-Type": "application/json"
            },
            success: function(response) {
                console.log(response);
            }
        });
    });

    // Open 'Add Comment' Dialouge
    $(document).on("click", ".fa-comment", function(event) {
        $(event.target).closest('.card-body')
            .find('.commentForm')
            .toggle();
    })

    // Post new comment
    $(document).on("click", ".post", function() {
        event.preventDefault();

        var index = $(this).closest(".card").find(".imgIndex")[0].innerText;
        var img = $(this).closest(".catImage");
        var form = $(this).closest(".card").find("form")[0].innerHTML;
        var username = $(form).find(".username")[0].innerText;
        var avatar = $(form).find(".avatar")[0].src;

        // Only second line works (???)
        // var msg = $(form).find("input.commentMsg")[0].value; // msg is empty
        var msg = document.getElementsByClassName("commentMsg")[index].value;

        // clean msg input
        document.getElementsByClassName("commentMsg")[index].value = "";

        var comment = JSON.stringify({
            "index": index,
            "username": username,
            "message": msg,
            "avatar": avatar
        })

        // send comment to server
        $.ajax({
            url: "http://localhost:8008/comment",
            type: "POST",
            datatype: "json",
            data: comment,
            headers: {
                "Content-Type": "application/json"
            },
            success: function(response) {
                console.log(response);

                // Write comment
                writeComment(response, img);
            }
        });
    });

    // Upload Image
    $("form#uploadForm").submit(function(event) {
        event.preventDefault();

        var username = $("input#usernameInput")[0].value;
        var loc = $("input#locationInput")[0].value;
        var desc = $("input#descriptionInput")[0].value;
        var link = $("input#imageInput")[0].value;
        var avatarSrc = $('input[name=avatarRadio]:checked', '#uploadForm')
            .closest("label")
            .find("img")[0].src;

        var img = JSON.stringify({
            "username": username,
            "location": loc,
            "avatar": avatarSrc,
            "picture": link,
            "description": desc,
            "comments": [],
            "likes": 0
        })

        // Upload new image to server
        $.ajax({
            url: "http://localhost:8008/upload",
            type: "POST",
            datatype: "json",
            data: img,
            headers: {
                "Content-Type": "application/json"
            },
            success: function(response) {
                console.log(response);

                // Write Image
                writeImage(response);
            }
        });
        $('#uploadModal').modal('toggle');
    });

    // Filter images by username
    $("form#searchForm").submit(function(event) {

        // empty all posts
        $(".cats").empty();

        var filterMsg = $(event.target)
            .find("input")[0]
            .value;

        // Possible to change this to get json from server instead
        $.getJSON("/db.json", function(data) {
            var filteredPosts = data.filter(function(v) {

                // check if filter is not empty
                if (filterMsg) {

                    // check if username contains filter
                    // return v.username.toLowerCase().includes(filterMsg.toLowerCase());

                    // check if username matches filter
                    // return v.username.toLowerCase() == filterMsg.toLowerCase();

                    // check if username starts with filter
                    return v.username.toLowerCase().startsWith(filterMsg.toLowerCase());

                } else {
                    return data;
                }
            });
            $.each(filteredPosts, function(key, val) {
                writeImage(val);
            });
        });

        // prevents page refresh
        event.preventDefault();
    });

})