import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import { cluster } from "../cluster";
import { appLoadBalancer, networkLoadBalancer } from "../load-balancer";

export const rabbitMQAdminTargetGroup = appLoadBalancer.createTargetGroup(
  "rabbitmq-admin-tg",
  {
    port: 15672,
    protocol: "HTTP",
    healthCheck: {
      path: "/",
      protocol: "HTTP",
    },
  }
);

export const amqpTargetGroup = networkLoadBalancer.createTargetGroup(
  "rabbitmq-amqp-tg",
  {
    protocol: "TCP",
    port: 5672,
    targetType: "ip",
    healthCheck: {
      protocol: "TCP",
      port: "5672",
    },
  }
);

export const rabbitMQAmqpListener = networkLoadBalancer.createListener(
  "rabbitmq-amqp-listener",
  {
    port: 5672,
    protocol: "TCP",
    targetGroup: amqpTargetGroup,
  }
);

export const rabbitMQAdminHttpListener = appLoadBalancer.createListener(
  "rabbitmq-admin-listener",
  {
    port: 15672,
    protocol: "HTTP",
    targetGroup: rabbitMQAdminTargetGroup,
  }
);

export const rabbitMQService = new awsx.classic.ecs.FargateService(
  "fargate-rabbitmq",
  {
    cluster,
    desiredCount: 1,
    waitForSteadyState: true,
    taskDefinitionArgs: {
      container: {
        image: "rabbitmq:3-management",
        cpu: 256,
        memory: 512,
        portMappings: [rabbitMQAdminHttpListener, rabbitMQAmqpListener],
        environment: [
          { name: "RABBITMQ_DEFAULT_USER", value: "admin" },
          { name: "RABBITMQ_DEFAULT_PASS", value: "admin" }, // usaria pulumi.secret para segurança em produção
        ],
      },
    },
  }
);
