var app = require("express")();
var mysql = require("mysql");
var http = require("http").Server(app);
var reqHandler = require('http');
var request = require('request');
var io = require("socket.io")(http);
var async = require("async");
var allusers = {};
var allusers_token = {};
var allusers_token_UID = {};
var cons = [];
var allUsersId = [];
var newUserNotify = [];

var pool = mysql.createPool({
    connectionLimit: 100,
    host: '198.57.230.170',
    user: 'root',
    password: 'Delete!@',
    database: 'wwwjobde_db',
    debug: false
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
function randomString() {
    var strChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    var strRandomstring = '';
    for (var intCounterForLoop = 0; intCounterForLoop < 30; intCounterForLoop++) {
        var rnum = Math.floor(Math.random() * strChars.length);
        strRandomstring += strChars.substring(rnum, rnum + 1);
    }
    return strRandomstring;
}
io.on('connection', function (socket) {
    var uid;

    console.log("user connected");

//to register new user on the server
    socket.on('register', function (id) {
        console.log("trying to registed");
        uid = id;
        console.log("trying to registed " + id);
        cons.push(socket);
        allUsersId.push(id);
        allusers[id] = socket;
        userList = Object.keys(allusers);
        allUsersId = userList;
        console.log("data--->" + allusers);
        async.each(cons, function (user) {
            user.emit("users_update", uid);
        }, function (err) {
        });


    });


    socket.on("videoRequest", function (info) {
        console.log("videoRequest request...");
        var rec_id = info.to;
        var sen_id = info.from;
        if (getMap(rec_id) == -1) {
            console.log("user not online");
            if (getMap(sen_id) == -1) {
                console.log("u self no dey  online");
            } else {
                getMap(sen_id).emit("videoRequestFailed", "failed");
            }
        } else {
            console.log(info);
            console.log("trying to send audio request from " + sen_id + " to " + rec_id);
            getMap(rec_id).emit("videoRequest", info);
        }

    });
    socket.on("terminatevideoRequest", function (info) {
        console.log("terminatevideoRequest comand...");
        var rec_id = info.to;
        var sen_id = info.from;
        if (getMap(rec_id) == -1) {
            console.log("user not online");
            if (getMap(sen_id) == -1) {
                console.log("u self no dey  online");
            } else {
                getMap(sen_id).emit("videoRequestFailed", "failed");
            }
        } else {
//                console.log(info);
//                console.log("trying to send audio request from " + sen_id +" to "+rec_id);
            getMap(rec_id).emit("terminatevideoRequest", info);
        }

    });
    socket.on("motiready", function (info) {
        console.log("motiready");
        var rec_id = info.to;
        var sen_id = info.from;
        if (getMap(rec_id) == -1) {
            console.log("user not online");
            if (getMap(sen_id) == -1) {
                console.log("u self no dey  online");
            } else {
                getMap(sen_id).emit("videoRequestFailed", "failed");
            }
        } else {
            console.log(info);
            //console.log("trying to send audio request from " + sen_id +" to "+rec_id);
            getMap(rec_id).emit("motiready", info);
        }

    });
    //motiready

    socket.on("msg_read", function (data) {
        console.log("update message");
        console.log(data);
        msg_read(data, function (res) {
            console.log("update" + res)
        });
    });

    socket.on("vid_accepted", function (data) {
        console.log("call accepted");
        msg_gen = randomString();
        console.log("call id==" + data.message);
        var rec_id = data.to;
        if (getMap(rec_id) == -1 || getMap(data.from) == -1) {
            console.log("Call Failed: hand shake");
            return;
        } else {
            getMap(rec_id).emit("vid_accepted", data.message);
            // getMap(data2).emit("vid_accepted", msg_gen);
        }
    });
    socket.on("vid_rejected", function (data) {
        console.log("call accepted");
        msg_gen = randomString();
        console.log("call id==" + data.message);
        var rec_id = data.to;
        if (getMap(rec_id) == -1 || getMap(data.from) == -1) {
            console.log("Call Failed: hand shake");
            return;
        } else {
            getMap(rec_id).emit("vid_rejected", data.message);
            // getMap(data2).emit("vid_accepted", msg_gen);
        }
    });



    socket.on("vid_rejected_busy", function (data) {
        console.log("video call recepient busy");
        console.log("here" + data);
        var rec_id = convert2id(data.to);
        getMap(rec_id).emit("video_rej_busy", data);

    });
    socket.on("audio_accepted", function (data) {
        console.log("call accepted");
        msg_gen = randomString();
        console.log("call id==" + msg_gen);
        var rec_id = convert2id(data.to);
        getUID("", data.from, function (err, data2) {
            if (err) {
                console.log("ERROR : ", err);
            } else {
                if (getMap(rec_id) == -1 || getMap(data2) == -1) {
                    console.log("Call Failed: hand shake");
                    return;
                } else {
                    getMap(rec_id).emit("audio_accepted", msg_gen);
                    getMap(data2).emit("audio_accepted", msg_gen);
                }
            }
        });
    });

    socket.on("audio_rejected", function (data) {
        console.log("audio call rejected");
        console.log("here" + data);
        var rec_id = convert2id(data.to);
        getUID("", data.from, function (err, data2) {
            if (err) {
                console.log("ERROR : ", err);
            } else {
                if (getMap(rec_id) == -1 || getMap(data2) == -1) {
                    console.log("Call Failed: hand shake");
                    return;
                } else {
                    getMap(rec_id).emit("audio_rej", data);
                    getMap(data2).emit("audio_rej", data);
                }
            }
        });

    });

    socket.on("call_ended_by_caller", function (data) {
        console.log("video call cancelled");
        console.log("here" + data);
        var rec_id = convert2id(data.to);
        getMap(rec_id).emit("call_ended_by_caller", data);
    });

    //typing....
    socket.on("ty", function (info) {
        console.log(info);
        console.log("ty");
        var rec_id = info.user2id;
        var sen_id = info.user1id;
        if (getMap(rec_id) == -1) {
            console.log("user not online");
            if (getMap(sen_id) == -1) {
                console.log("u self no dey  online");
            } else {
            }
        } else {
            console.log(info);
            console.log("trying to send typing request from " + sen_id + " to " + rec_id);
            getMap(rec_id).emit("ty", info);
        }

    });

    socket.on("pm", function (info) {
        console.log(info);
        console.log("pm");
        var rec_id = info.user2id;
        var sen_id = info.user1id;
        if (getMap(rec_id) == -1) {
            console.log("user not online");
            if (getMap(sen_id) == -1) {
                console.log("u self no dey  online");
            } else {
            }
            add_status(info, function (res) {
                if (res) {
                    info["status"] = res.split(":")[0] + ":" + res.split(":")[1];
                    console.log("sending message to---> " + info.user2id + ' time= ' + res);

                    if (getMap(rec_id) == -1) {
                        console.log("user not online");
                        if (getMap(sen_id) == -1) {
                            console.log("u self no dey  online");
                        } else {
                            console.log("seningg notificaTIONS");
                            getMap(sen_id).emit("status_sent", info);
                        }
                    } else {
                        getMap(rec_id).emit("message", info);
                        if (getMap(rec_id) == -1) {
                            console.log("user not online");

                        } else {
                            if (getMap(sen_id) == -1) {
                                console.log("u self no dey  online");
                            } else {
                                console.log("seningg notificaTIONS");
                                getMap(sen_id).emit("status_sent", info);
                            }
                            console.log("13/09/2015 ->" + getMap(rec_id));


                        }
                    }

                } else {
                    io.emit('error');
                }
            });
        } else {
            console.log(info);

            add_status(info, function (res) {
                if (res) {
                    info["status"] = res.split(":")[0] + ":" + res.split(":")[1];
                    console.log("sending message to---> " + info.user2id + ' time= ' + res);

                    if (getMap(rec_id) == -1) {
                        console.log("user not online");
                        if (getMap(sen_id) == -1) {
                            console.log("u self no dey  online");
                        } else {
                            console.log("seningg notificaTIONS");
                            getMap(sen_id).emit("status_sent", info);
                        }
                    } else {
                        getMap(rec_id).emit("message", info);
                        if (getMap(rec_id) == -1) {
                            console.log("user not online");

                        } else {
                            if (getMap(sen_id) == -1) {
                                console.log("u self no dey  online");
                            } else {
                                console.log("seningg notificaTIONS");
                                getMap(sen_id).emit("status_sent", info);
                            }
                            console.log("13/09/2015 ->" + getMap(rec_id));


                        }
                    }

                } else {
                    io.emit('error');
                }
            });



            //console.log("trying to send audio request from " + sen_id +" to "+rec_id);
            getMap(rec_id).emit("ty", info);
        }

    });



    // socket.on('pm', function(info) {
    //     console.log("message...");
    //     console.log(info);
    //     var rec_id = convert2id(info.user2id);
    //     var sen_id = 0;

    //     getToken("", rec_id, function(err, data) {
    //         if (err) {
    //             console.log("ERROR : ", err);
    //         } else {
    //             console.log('iias;' + rec_id);
    //             getUID("", info.user1id, function(err, data2) {
    //                 if (err) {
    //                     console.log("ERROR : ", err);
    //                 } else {
    //                     console.log("receiver token: " + data + "sender id " + data2);
    //                     console.log("recipient id ->" + generate_id(data2, data));
    //                     info['user1ida'] = data2;
    //                     info['user2ida'] = rec_id;
    //                     console.log(data2 + "xactly before safe :" + info.user1id);
    //                     add_status(info, function(res) {
    //                         if (res) {
    //                             info["status"] = res.split(":")[0] + ":" + res.split(":")[1];
    //                             console.log("sending message to---> " + info.user2id + ' time= ' + res);

    //                             if (getMap(rec_id) == -1) {
    //                                 console.log("user not online");
    //                                 if (getMap(data2) == -1) {
    //                                     console.log("u self no dey  online");
    //                                 } else {
    //                                     console.log("seningg notificaTIONS");
    //                                     getMap(data2).emit("status_sent", info);
    //                                 }
    //                             }
    //                             else {
    //                                 console.log("my recever " + generate_id(data2, getUseToken(rec_id)));
    //                                 info['user1id'] = generate_id(data2, getUseToken(rec_id));
    //                                 console.log(info);

    //                                 getMap(rec_id).emit("message", info);

    //                                 if (getMap(rec_id) == -1) {
    //                                     console.log("user not online");

    //                                 } else {
    //                                     if (getMap(data2) == -1) {
    //                                         console.log("u self no dey  online");
    //                                     } else {
    //                                         console.log("seningg notificaTIONS");
    //                                         getMap(data2).emit("status_sent", info);
    //                                     }
    //                                     console.log("13/09/2015 ->" + getMap(rec_id));


    //                                 }
    //                             }

    //                         } else {
    //                             io.emit('error');
    //                         }

    //                     });

    //                 }
    //             });

    //         }
    //     });



    // });




    socket.on('status_added', function (status) {

    });

    socket.on('disconnect', function () {
//        console.log('user disconnected id' + uid)
        console.log("user  " + uid + " went Offline");
        last_seen(uid, function (res) {
            console.log("last seen" + res);
        });
        delete allusers[uid];
        allUsersId.splice(allUsersId.indexOf(uid), 1);
        userList = Object.keys(allusers);
        allUsersId = userList;
        if (userList.length < 1) {
            console.log("EveryBody is Out")
        }
        async.each(cons, function (user) {
            user.emit("users_update", allUsersId);
        }, function (err) {
        });

    });

    socket.on("video", function (data) {
//        console.log(data);
        from = data.from;
        to = data.to;
        msg = data.msg;
//        console.log(data);
        if (getMap(to) == -1) {
            console.log("user not online!!!! " + to + "!!! from " + from);
            return;
        } else {
            console.log("emiting video " + from);
            getMap(to).emit("video", msg);
        }

    });

    socket.on("video_call", function (data) {
        console.log(data);
        from = data.user1id;
        to = data.user2id;
        var out_vid = {
            user1id: data.user1id,
            user1un: data.user1un
        };

        if (getMap(data.user2id) == -1) {
            console.log("user not online!!!! " + to + "!!! from " + from);
            getMap(data.user1id).emit("call_failed", "");
            console.log("video call from " + out_vid.user1un + "!!! to " + data.user2un);
            return;
        } else {
            console.log("emiting video " + from);
            getMap(to).emit("video_in", out_vid);
        }

    });



});

//inserts a message to the database
var add_status = function (status, callback) {
    pool.getConnection(function (err, connection) {
        console.log(err);
        if (err) {
            connection.release();
            callback(false);
            return;
        }
        message = status.message;
        user1id = status.user1id;
        user2id = status.user2id;
        status1 = status.status;
        var databasename=status.db;
        var time1 = new Date();
        var goh = time1.getFullYear() + "-" + (time1.getMonth() + 1) + "-" + time1.getDate();
        console.log(" getting date  == " + goh);

        var time2 = new Date();
        var secon = time2.getHours() + ":" + time2.getMinutes() + ":" + time2.getSeconds();
        console.log(" getting time == " + secon);
        console.log(message + user1id + user2id + status);
        var getting_time = secon;
        var query = "INSERT INTO `"+databasename+"` (`message`,`user1id`,`user2id`,`status`,`msg_date`,`msg_time`) VALUES ?";
        var data = [
            [message, user1id, user2id, status1, goh, secon]
        ];
//        console.log("what to sfe " + data);
        connection.query(query, [data], function (err, rows) {
            connection.release();
            if (!err) {
                console.log("AKIN--->" + rows.id);
                var msgString = JSON.stringify(status);
//                request.post(
//                        'http://localhost/medslat/mobile/puShMessage/',
//                        {form: status},
//                function(error, response, body) {
//                    if (!error && response.statusCode === 200) {
//                        console.log(body);
//
//                    }
//                }
//                );
                callback(secon);
            }

        });
        connection.on('error', function (err) {
            callback(false);
            return;
        });
    });
};

//inserts a message to the database

//update message status as read
var msg_read = function (data, callback) {
    var rec_id = convert2id(data.user2id);
    var sen_id = 0;
    getUID("", data.user1id, function (err, data) {
        if (err) {
            console.log("ERROR : ", err);
        } else {
            pool.getConnection(function (err, connection) {
                if (err) {
                    connection.release();
                    callback(false);
                    return;
                }
                var id1 = data;
                var id2 = rec_id;
                connection.query("UPDATE `message_tbl` SET `status`=1 WHERE  (user1id='" + id1 + "' AND user2id='" + id2 + "') OR (user2id='" + id1 + "' AND user1id='" + id2 + "')"), function (err, rows) {
                    connection.release();
                };
                connection.on('error', function (err) {
                    callback(false);
                    return;
                });
            });
        }
    });

};
function getUID(username, roomCount, callback)
{
//    getUseTokenUID
    // if (getUseTokenUID(roomCount) !== -1) {
    //     console.log("from inside get yuid");
    //     callback(null, getUseTokenUID(roomCount));
    // }
    // else {
    console.log("get uid " + roomCount);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            callback(false);
            return;
        }
        connection.query('SELECT id FROM user WHERE UNAME = ?', [roomCount], function (err, result)
        {
            if (err)
                callback(err, null);
            else
                console.log(result);
            if (result.length !== 0) {
                console.log("---->" + result[0].id);
                callback(null, result[0].id);
            }

//                

        });
    });
    // }


}
function getToken(username, id, callback)
{

    if (getUseToken(id) !== -1) {
        console.log("from inside");
        callback(null, getUseToken(id));
    } else {
        console.log("from database");
        console.log("get token " + id);
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                callback(false);
                return;
            }
            connection.query('SELECT login_token FROM signup_tbl WHERE id = ?', [id], function (err, result)
            {
                if (err)
                    callback(err, null);
                else
                    console.log(result);
                if (result.length !== 0) {
                    console.log("---->" + result[0].login_token);
                    callback(null, result[0].login_token);
                }

//                
                var d = new Date();
                var curr_date = d.getDate();
                if (curr_date < 10) {
                    curr_date = '0' + curr_date;
                }

                var curr_month = d.getMonth() + 1;
                if (curr_month < 10) {
                    curr_month = '0' + curr_month;
                }

                var curr_year = d.getFullYear();
                if (curr_year < 10) {
                    curr_year = '0' + curr_year;
                }
            });
        });
    }


}
//call Fn for db query with callback

//update user last seen 
var last_seen = function (data, callback) {
    console.log("here");
    var a_p = "";
    var d = new Date();

    var curr_hour = d.getHours();

    if (curr_hour < 12)
    {
        a_p = "AM";
    } else
    {
        a_p = "PM";
    }
    if (curr_hour == 0)
    {
        curr_hour = 12;
    }
    if (curr_hour > 12)
    {
        curr_hour = curr_hour - 12;
    }

    var curr_min = d.getMinutes();

    var current_time = curr_hour + " : " + curr_min + " " + a_p;


    var m_names = new Array("January", "February", "March",
            "April", "May", "June", "July", "August", "September",
            "October", "November", "December");

    var d = new Date();
    var curr_date = d.getDate();
    if (curr_date < 10) {
        curr_date = '0' + curr_date;
    }

    var curr_month = d.getMonth() + 1;
    if (curr_month < 10) {
        curr_month = '0' + curr_month;
    }

    var curr_year = d.getFullYear();
    if (curr_year < 10) {
        curr_year = '0' + curr_year;
    }
    var current_date = curr_date + "-" + curr_month + "-" + curr_year;

    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            callback(false);
            return;
        }
//console.log("UPDATE `message_tbl` SET `status`=3 WHERE  (user1id='" + id1 + "' AND user2id='" + id2 + "') OR (user2id='" + id1 + "' AND user1id='" + id2 + "')");
        connection.query("UPDATE `signup_tbl` SET `last_date`='" + current_date + "',`last_time`='" + current_time + "' WHERE  id='" + data + "'"), function (err, rows) {
//           (user1id=:user1id AND user2id=:user2id) OR (user2id=:user1id AND user1id=:user2id)
//'" + id1 + "'
            connection.release();

        };
        connection.on('error', function (err) {
            callback(false);
            return;
        });
    });
};

// to check of a user is in the userlist (returns a value)
function getMap(k) {
//    console.log(allusers[k]);
//allusers[k];
    if (!allusers[k]) {
        console.log("map not found");
        return -1;
    } else {
//        console.log(allusers[k]);
        return allusers[k];
    }

}
function getUseToken(k) {
    if (!allusers_token[k]) {
        console.log("map not found");
        return -1;
    } else {
        return allusers_token[k];
    }

}
function getUseTokenUID(k) {
    if (!allusers_token_UID[k]) {
        console.log("map2 not found");
        return -1;
    } else {
        return allusers_token_UID[k];
    }

}

function convert2id(uid) {
    var id_count = uid.split('').length;
    var pos = 0;
    var end = 0;
    switch (id_count) {
        case 51:
            pos = 31;
            end = 31;
            break;
        case 52:
            pos = 32;
            end = 33;
            break;
        case 53:
            pos = 33;
            end = 35;
            break;
        case 54:
            pos = 34;
            end = 37;
            break;
        case 55:
            pos = 21;
            end = 25;
            break;
        case 56:
            pos = 22;
            end = 27;
            break;
        case 57:
            pos = 23;
            end = 29;
            break;
        case 58:
            pos = 24;
            end = 31;
            break;
        case 59:
            pos = 11;
            end = 19;
            break;
        case 60:
            pos = 12;
            end = 21;
            break;
        case 61:
            pos = 13;
            end = 23;
            break;
        case 62:
            pos = 14;
            end = 25;
            break;
        default:
//                echo "!!";
    }
    return picksub(uid, pos, end);
}
function picksub(str, start, end) {
    var tokenarray = str.split('');
    var uid = "";
    if (start === end) {
        return tokenarray[start];
    } else if (start < end) {
        for (var index = start; index <= end; index++) {
            uid += tokenarray[index];
        }
        return uid;
    } else {
        return uid;
    }
}

function generate_id(uid, token) {
    console.log("tokennnn " + token + " uid " + uid);
    var n_uid = "a" + uid;
    var id_count = n_uid.split('').length - 1;

    var pos = 0;
    switch (id_count) {
        case 1:
            pos = 31;
            break;
        case 2:
            pos = 32;
            break;
        case 3:
            pos = 33;
            break;
        case 4:
            pos = 34;
            break;
        case 5:
            pos = 21;
            break;
        case 6:
            pos = 22;
            break;
        case 7:
            pos = 23;
            break;
        case 8:
            pos = 24;
            break;
        case 9:
            pos = 11;
            break;
        case 10:
            pos = 12;
            break;
        case 11:
            pos = 13;
            break;
        case 12:
            pos = 14;
            break;
        default:
//                echo "!";
    }

    return putinplace(token, uid, pos);
}

function putinplace(str, insertstr, pos) {
    console.log("positoion :" + pos);
    return str.substr(0, pos) + insertstr + str.substr(pos);
}
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
http.listen(port, function () {
    console.log("listening on port "+port);
});
