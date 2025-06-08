import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import { cluster } from "../cluster";
import { kongDockerImage } from "../images/kong";
import { appLoadBalancer, networkLoadBalancer } from "../load-balancer";
import { ordersHttpListener } from "./order";

export const proxyTargetGroup = appLoadBalancer.createTargetGroup("proxy-tg", {
  port: 8000,
  protocol: "HTTP",
  healthCheck: {
    path: "/orders/health",
    protocol: "HTTP",
  },
});

export const proxyHttpListener = appLoadBalancer.createListener(
  "kong-listener",
  {
    port: 80,
    protocol: "HTTP",
    targetGroup: proxyTargetGroup,
  }
);

export const adminTargetGroup = appLoadBalancer.createTargetGroup(
  "admin-kong-tg",
  {
    port: 8002,
    protocol: "HTTP",
    healthCheck: {
      path: "/",
      protocol: "HTTP",
    },
  }
);

export const adminHttpListener = appLoadBalancer.createListener(
  "admin-kong-listener",
  {
    port: 8002,
    protocol: "HTTP",
    targetGroup: adminTargetGroup,
  }
);

export const adminAPITargetGroup = appLoadBalancer.createTargetGroup(
  "admin-api-kong-tg",
  {
    port: 8001,
    protocol: "HTTP",
    healthCheck: {
      path: "/",
      protocol: "HTTP",
    },
  }
);

export const adminAPIHttpListener = appLoadBalancer.createListener(
  "admin-api-kong-listener",
  {
    port: 8001,
    protocol: "HTTP",
    targetGroup: adminAPITargetGroup,
  }
);

export const kongService = new awsx.classic.ecs.FargateService("fargate-kong", {
  cluster,
  desiredCount: 1,
  waitForSteadyState: true,
  taskDefinitionArgs: {
    container: {
      image: kongDockerImage.ref,
      cpu: 256,
      memory: 512,
      portMappings: [
        proxyHttpListener,
        adminAPIHttpListener,
        adminHttpListener,
      ],
      environment: [
        { name: "KONG_DATABASE", value: "off" },
        { name: "KONG_ADMIN_LISTEN", value: "0.0.0.0:8001" },
        {
          name: "ORDERS_SERVICE_URL",
          value: pulumi.interpolate`http://${ordersHttpListener.endpoint.hostname}:${ordersHttpListener.endpoint.port}`,
        }, // usaria pulumi.secret para segurança em produção
      ],
    },
  },
});
