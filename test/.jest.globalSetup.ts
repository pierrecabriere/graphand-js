import axios from "axios";
import Locales from "../src/enums/locales";

export default async () => {
  try {
    // login test user
    const { data: loginData } = await axios.post("http://api.graphand.io.local:1337/auth/login", { email: "test@graphand.io", password: "test123" });

    // create project
    const { data: projectData } = await axios.post(
      "http://api.graphand.io.local:1337/projects",
      { name: "Test runner", slug: "test-runner", locales: [Locales.FR], defaultLocale: Locales.FR },
      {
        headers: {
          Authorization: `Bearer ${loginData.data.accessToken}`,
        },
      },
    );

    Object.assign(process.env, {
      userAccessToken: loginData.data.accessToken,
      projectId: projectData.data._id,
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
};
