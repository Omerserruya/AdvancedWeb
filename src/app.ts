import initApp from "./server";
const port = process.env.PORT;

initApp().then((app) => {
  app.listen(port, () => {
    // console.log(`[ ${new Date().toISOString()} ] Server is running on port ${port}`);
  });
});