import { Express, Request, Response } from 'express';
import { createFlickr } from "flickr-sdk"

var db = {
    users: new Map(),
    oauth: new Map(),
}

const oauthApi = (app: Express) => {
    app.get('/', async (req: Request, res: Response) => {
        const { oauth } = createFlickr({
            consumerKey: process.env.FLICKR_CONSUMER_KEY,
            consumerSecret: process.env.FLICKR_CONSUMER_SECRET,
            oauthToken: false,
            oauthTokenSecret: false,
        })

        try {
            // request an oauth token and secret, supplying a callback url
            const { requestToken, requestTokenSecret } = await oauth.request(
                "https://localhost:3000/oauth/callback",
            )

            // store the request token and secret in the database
            db.oauth.set(requestToken, requestTokenSecret)

            // redirect the user to flickr and ask them to authorize your app.
            // perms default to "read", but you may specify "write" or "delete".
            res.statusCode = 302
            res.setHeader("location", oauth.authorizeUrl(requestToken, "write"))
            res.end()
        } catch (err) {
            console.error(err)
            res.statusCode = 400
            res.end(err.message)
        }
    })

    app.get('/oauth/callback', async (req: Request, res: Response) => {
        const requestToken = req.query.oauth_token as string;
        const oauthVerifier = req.query.oauth_verifier as string;

        // retrieve the request secret from the database
        const requestTokenSecret = db.oauth.get(requestToken)

        const { oauth } = createFlickr({
            consumerKey: process.env.FLICKR_CONSUMER_KEY,
            consumerSecret: process.env.FLICKR_CONSUMER_SECRET,
            oauthToken: requestToken,
            oauthTokenSecret: requestTokenSecret,
        })

        try {
            const { nsid, oauthToken, oauthTokenSecret } =
                await oauth.verify(oauthVerifier)

            // store the oauth token and secret in the database
            db.users.set(nsid, {
                oauthToken: oauthToken,
                oauthTokenSecret: oauthTokenSecret,
            })

            // we no longer need the request token and secret so we can delete them
            db.oauth.delete(requestToken)

            // log our oauth token and secret for debugging
            // NB don't do this in production!
            console.log("oauth token:", oauthToken)
            console.log("oauth token secret:", oauthTokenSecret)

            // create a new Flickr API client using the oauth credentials
            const { flickr } = createFlickr({
                consumerKey: process.env.FLICKR_CONSUMER_KEY,
                consumerSecret: process.env.FLICKR_CONSUMER_SECRET,
                oauthToken,
                oauthTokenSecret,
            })

            // make an API call on behalf of the user
            const login = await flickr("flickr.test.login", {})
            console.log(login)

            res.end(JSON.stringify(login))
        } catch (err) {
            console.error(err)
            res.statusCode = 400
            res.end(err.message)
        }
    })
}



export default oauthApi;