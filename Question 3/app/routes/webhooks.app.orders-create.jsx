import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, payload, topic, admin } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);
    const order = payload;

    const isPreorder = order.line_items?.some((item) =>
      item.properties?.some(
        (prop) =>
          prop.name?.toLowerCase().includes("pre-order") &&
          prop.value?.toLowerCase() === "yes"
      )
    );

    console.log("isPreorder:", isPreorder);

    if (isPreorder && order.admin_graphql_api_id) {
    console.log("inside:", 'check');

      const orderId = order.id;
      const newTags = "pre-order"; // or dynamic tag
      console.log("inside:", { admin, orderId , newTags});
  

      const result = await admin.graphql(
        `#graphql
        mutation addTags($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) {
            node {
              id
            }
            userErrors {
              message
            }
          }
        }`,
        {
          variables: {
            id: order.admin_graphql_api_id,
            tags: [newTags],
          },
        }
      );

      console.log("GraphQL tag add result:", JSON.stringify(result, null, 2));
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
