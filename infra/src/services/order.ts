import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import { cluster } from "../cluster";
import { ordersDockerImage } from "../images/order";
import { appLoadBalancer, networkLoadBalancer } from "../load-balancer";
import { rabbitMQAmqpListener } from "../services/rabbitmq";

export const ordersTargetGroup = appLoadBalancer.createTargetGroup(
  "orders-tg",
  {
    port: 8080,
    protocol: "HTTP",
    healthCheck: {
      path: "/",
      protocol: "HTTP",
    },
  }
);

export const ordersHttpListener = appLoadBalancer.createListener(
  "orders-listener",
  {
    port: 8080,
    protocol: "HTTP",
    targetGroup: ordersTargetGroup,
  }
);

export const ordersService = new awsx.classic.ecs.FargateService(
  "fargate-orders",
  {
    cluster,
    desiredCount: 1,
    waitForSteadyState: true,
    taskDefinitionArgs: {
      container: {
        image: ordersDockerImage.ref,
        cpu: 256,
        memory: 512,
        portMappings: [ordersHttpListener],
        environment: [
          {
            name: "BROKER_URL",
            value: pulumi.interpolate`amqp://admin:admin@${rabbitMQAmqpListener.endpoint.hostname}:${rabbitMQAmqpListener.endpoint.port}`,
          },
          {
            name: "DATABASE_URL",
            value:
              "postgresql://orders_owner:npg_I3uU0EPacqMk@ep-square-smoke-a52rkp4q.us-east-2.aws.neon.tech/orders?sslmode=require",
          },
          {
            name: "OTEL_SERVICE_NAME",
            value: "orders",
          },
          {
            name: "OTEL_TRACES_EXPORTER",
            value: "otlp",
          },
          {
            name: "OTEL_EXPORTER_OTLP_ENDPOINT",
            value: "https://otlp-gateway-prod-sa-east-1.grafana.net/otlp",
          },
          {
            name: "OTEL_EXPORTER_OTLP_HEADERS",
            value:
              "Authorization=Basic MTI4MjU0NzpnbGNfZXlKdklqb2lNVFExTWpVM055SXNJbTRpT2lKemRHRmpheTB4TWpneU5UUTNMVzkwWld3dGIyNWliMkZ5WkdsdVp5MWxkbVZ1ZEc5dWIyUmxhbk1pTENKcklqb2ljekZ0YzJwTE5qZ3lObkV3TkVZd1NtUnhkVmN4VlZjMUlpd2liU0k2ZXlKeUlqb2ljSEp2WkMxellTMWxZWE4wTFRFaWZYMD0=",
          },
          {
            name: "OTEL_RESOURCE_ATTRIBUTES",
            value:
              "service.name=my-app,service.namespace=my-application-group,deployment.environment=production",
          },
          {
            name: "OTEL_NODE_RESOURCE_DETECTORS",
            value: "env,host,os",
          },
          {
            name: "OTEL_NODE_ENABLED_INSTRUMENTATIONS",
            value: "http,fastify,pg,amqplib",
          },
        ],
      },
    },
  }
);
