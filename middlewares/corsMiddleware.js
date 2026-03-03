const corsOptions = {
    origin: [process.env.ADMIN_URL, process.env.LANDING_PAGE_URL],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true

}

module.exports = corsOptions