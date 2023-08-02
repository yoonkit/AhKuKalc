// ==UserScript==
// @name         WhatsApp Interface for AhKuKalc
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Chatbot to provide simple addition problems and feedback for young brains
// @author       Yoon-Kit Yong
// @match        https://web.whatsapp.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=whatsapp.com
// @grant        none
// @require      https://code.jquery.com/jquery-3.5.1.min.js#sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=
// @run-at       document-idle
// ==/UserScript==

//const delay = ms => new Promise(res => setTimeout(res, ms));

var $ = window.jQuery; // 230729 yky Watch out for Apple problems with jQuery
var debug = -1; //230729 yky Set to -1 for production, 0 for debug

//const getChatTitle = async () =>
function getChatTitle()
{
    // 230731 yky Created
    var headers = document.getElementsByClassName("_2au8k")
    var isGroup = false
    var title = ""
    var members = ""

    if (headers.length == 1)
    {
        // await delay(5000)
        //_3W2ap - span (individual)
        var divs = headers[0].getElementsByTagName("div")
        if (divs.length == 3)
        {
            isGroup = true
            title = divs[1].textContent
            members = divs[2].textContent
            if (members == "click here for contact info")
            {
                isGroup = false
                members = ""
            }
            else if (members == "click here for group info")
            {
                members = ""
            }
        }
        else if (divs.length == 2)
        {
            title = divs[1].textContent
        }
    }
    return [isGroup, title, members]
}


function ykAlert( msg, type=0 )
{
    /* Messages for debugging with varying degrees of reporting methods
     *     -1 : Dont report
     *      0 : console.log <Default>
     *      1 : window.alert (very annoying)
     * 230728 yky Created
     */
    if (type < 0) return type
    else if (type == 1) window.alert( msg )
    else console.log( msg );
    return 0;
}

const goodEmojis = { '❤️': true, '👍': true, '😍': true, '🥰': true, '🤟🏻': true,
                    '😮':false, '😢': false, '🥵': false, '❌': false, '🫣': false }

function getDateTimeAuthorFromPrePlainText( preplain )
{
    /* Function to parse the WhatsApp texts which look like '[21:40, 31/07/2023] Author Name: '
     *   Into a DateTime object
     *      Date to be in DD/MM/YYYY for now
     *   Cleaned Author name
     * 230731 yky Created
    */
    var [ datetimestr, authorstr ] = preplain.replace('[','').split(']')
    var [ timestr, datestr ] = datetimestr.split(', ')
    var [ day, month, year ] = datestr.split('/')
    var datetime = new Date( year + "-" + month + "-" + day + "T" + timestr + ":00" )
    authorstr = authorstr.trim()
    return [ datetime, authorstr ]
}

function getChatTexts()
{
    /* Scans the current page for the messages
     *   DateTime
     *   Author
     *   Message
     *   Emoji - hasEmoji, charEmoji, isGoodEmoji
     * Returns the list of messages
     * 230731 yky Created
    */
    var result = []
    var seltext = document.getElementsByClassName("_11JPr selectable-text")
    for (let text of seltext)
    {
        if (text.classList.length > 5) continue
        var message = text.textContent
        var parent = text.parentElement.parentElement
        var attribute = parent.attributes['data-pre-plain-text'].textContent // "[20:53, 31/07/2023] Wong Wei Yuen: "

        var hasEmoji = false
        var charEmoji = ""
        var emoji = parent.parentElement.parentElement.parentElement.nextSibling
        if (emoji != null)
        {
            var imgs = emoji.getElementsByTagName('img')
            if (imgs.length > 0)
            {
                hasEmoji = true
                charEmoji = imgs[0].alt
            }
        }

        var [datetime, author] = getDateTimeAuthorFromPrePlainText( attribute )
        var sentimentEmoji = goodEmojis[charEmoji]
        let res = [datetime, author, message, hasEmoji, charEmoji, sentimentEmoji ]

        ykAlert( res, -1)

        result.push( res )
    }
    return result
}

function clickSend(div)
{
    /* Clicks the Send button if available
     *   Usually called as a setTimeout function as the widget isnt displayed after the first text is entered into the textarea
     * 230802 yky Created
    */
	var send = null
    var i = 3
    do {
        let sends = document.getElementsByClassName("tvf2evcx oq44ahr5 lb5m6g5c svlsagor p2rjqpw5 epia9gcq")
        if (sends.length > 0)
        {
            send = sends[0]
            send.click()
        } else
        {
            div.focus()
            document.execCommand('insertText', false, ' ' )

        }
        //ykAlert( send )
    } while ( (send == null) & (i-- > 0) )
}

function sendMessage( text )
{
    /* Updates the textarea for messages to be sent
     *   Executes the send button
     *   Problem with div textareas is that the <p> only appears when at least one character is input
     *     Doesnt work by manipulating the innerHTML, appendChild, and textContent.
     *     Seems to work with execCommand('insertText' .. ) however this will be deprecated soon.
     *   Send button will only appear only a few milliseconds after the insertText. Needs a delay
     * 230801 yky Created
    */
    var div = document.getElementsByClassName("to2l77zo gfz4du6o ag5g9lrv bze30y65 kao4egtt")[1]
    div.focus()
    document.execCommand('insertText', false, text )

    setTimeout( function () {clickSend(div)}, 500 )
}

function simulateKeyPress(field, key)
{
    /* Keypresses on the elements
     *   Unfortunately these events.isTrusted == false
     * 230801 yky Created
    */
    const eventdown = new KeyboardEvent('keydown', { 'key': key });
    const eventup = new KeyboardEvent('keyup', { 'key': key });
    field.focus();
    field.dispatchEvent(eventdown);
    field.dispatchEvent(eventup);
}


var oldtexts = []

function updateWhatsApp()
{
    var [isGroup, titile, members] = getChatTitle()
    //ykAlert("update")
    var texts = getChatTexts()
    //ykAlert("length: " + seltex.length)
    if (texts.length != oldtexts.length)
    {
        ykAlert("length: " + texts.length)
        let last = texts[ texts.length -1]
        let [datetime, author, message, hasEmoji, charEmoji, sentimentEmoji ] = last
        if (!hasEmoji)
        {
            ykAlert("Needs Feedback: " + message )
            if ( message == "maths" )
            {
                sendMessage( "5 + eight plus nine equals" )
            }
        }
    }
    oldtexts = texts
}

setInterval( function () { updateWhatsApp() }, 5000)
