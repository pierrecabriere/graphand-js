import axios from "axios";
import Locales from "../src/enums/locales";

export default async () => {
  try {
    // login test user
    const { data: loginData } = await axios.post("https://api.graphand.io/auth/login", { email: "test@graphand.io", password: "test123" });

    // create project
    const { data: projectData } = await axios.post(
      "https://api.graphand.io/projects",
      { name: "Test runner", slug: "test-runner", locales: [Locales.FR], defaultLocale: Locales.FR, organization: "62c4c3ea2111bb7955a5a67f" },
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
    throw e;
  }
};
