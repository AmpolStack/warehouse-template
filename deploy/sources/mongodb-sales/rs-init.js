const rsConfig = {
    _id: "rs0",
    members: [{ _id: 0, host: "sales-database:27017" }]
};
let initiated = false;
try {
    const status = rs.status();
    if (status.ok === 1) {
        print("Replica set ya estaba iniciado, omitiendo rs.initiate().");
        initiated = true;
    }
} catch (e) {
}

if (!initiated) {
    const result = rs.initiate(rsConfig);
    if (result.ok !== 1) {
        print("ERROR al iniciar replica set: " + JSON.stringify(result));
        quit(1);
    }
    print("Replica set iniciado exitosamente.");
}

print("Esperando que el nodo sea PRIMARY...");
let retries = 30;
while (retries-- > 0) {
    const state = rs.status().myState; // 1 = PRIMARY
    if (state === 1) {
        print("Nodo es PRIMARY. Esperando estabilización...");
        sleep(2000); // dar tiempo al nodo para completar la transición de escritura
        print("Continuando con la inicialización.");
        break;
    }
    sleep(1000);
}
if (retries <= 0) {
    print("ERROR: El nodo no alcanzó estado PRIMARY a tiempo.");
    quit(1);
}

const adminDb = db.getSiblingDB('admin');
adminDb.auth('root', 'root');

if (!adminDb.getUser('debezium_user')) {
    adminDb.createUser({
        user: "debezium_user",
        pwd: "debezium_pass",
        roles: [
            { role: "read", db: "admin" },
            { role: "readAnyDatabase", db: "admin" },
            { role: "clusterMonitor", db: "admin" }   // necesario para que Debezium inspeccione la topología del replica set
        ],
        mechanisms: ["SCRAM-SHA-256"]
    });
    print("Usuario debezium_user creado.");
} else {
    print("Usuario debezium_user ya existe, omitiendo creación.");
}

const salesDb = db.getSiblingDB('sales_database');

salesDb.createCollection('orders');
salesDb.createCollection('orderLines');

salesDb.orders.createIndex({ "tenant_id": 1, "orderDate": -1 });
salesDb.orders.createIndex({ "tenant_id": 1, "customerId": 1 });
salesDb.orders.createIndex({ "tenant_id": 1, "employeeId": 1 });
salesDb.orders.createIndex({ "tenant_id": 1, "branchId": 1 });
salesDb.orders.createIndex({ "tenant_id": 1, "status": 1 });
salesDb.orders.createIndex({ "tenant_id": 1, "paymentMethodId": 1 });
salesDb.orders.createIndex({ "orderId": 1 }, { unique: true });
salesDb.orders.createIndex({ "createdAt": -1 });

salesDb.orderLines.createIndex({ "tenant_id": 1, "orderId": 1 });
salesDb.orderLines.createIndex({ "tenant_id": 1, "orderId": 1, "productId": 1 });
salesDb.orderLines.createIndex({ "tenant_id": 1, "eventType": 1, "timestamp": -1 });
salesDb.orderLines.createIndex({ "lineId": 1, "seq": 1 });
salesDb.orderLines.createIndex({ "timestamp": -1 });

salesDb.orders.insertOne({
    orderId: "ORD-1001",
    tenant_id: 1,
    customerId: 10001,
    employeeId: 2001,
    paymentMethodId: 2,
    branchId: 301,
    orderDate: new Date("2026-05-10T10:30:00Z"),
    totalAmount: 1250.00,
    status: "completed",
    createdAt: new Date("2026-05-10T10:30:00Z"),
    updatedAt: new Date("2026-05-10T10:30:16Z")
});

salesDb.orderLines.insertMany([
    {
        lineId: "LINE-1001-1", orderId: "ORD-1001", tenant_id: 1, productId: 5001,
        quantity: 2, unitPrice: 500.00, discount: 20.00, cost: 350.00, taxRate: 0.19,
        eventType: "created", timestamp: new Date("2026-05-10T10:30:01Z"), seq: 1
    },
    {
        lineId: "LINE-1001-1", orderId: "ORD-1001", tenant_id: 1, productId: 5001,
        quantity: 2, unitPrice: 500.00, discount: 20.00, cost: 350.00, taxRate: 0.19,
        eventType: "paid", timestamp: new Date("2026-05-10T10:30:15Z"), seq: 2
    },
    {
        lineId: "LINE-1001-2", orderId: "ORD-1001", tenant_id: 1, productId: 5002,
        quantity: 1, unitPrice: 300.00, discount: 0, cost: 210.00, taxRate: 0.19,
        eventType: "created", timestamp: new Date("2026-05-10T10:30:02Z"), seq: 1
    },
    {
        lineId: "LINE-1001-2", orderId: "ORD-1001", tenant_id: 1, productId: 5002,
        quantity: 1, unitPrice: 300.00, discount: 0, cost: 210.00, taxRate: 0.19,
        eventType: "paid", timestamp: new Date("2026-05-10T10:30:16Z"), seq: 2
    }
]);

salesDb.orders.insertOne({
    orderId: "ORD-1002",
    tenant_id: 1,
    customerId: 10002,
    employeeId: 2002,
    paymentMethodId: 1,
    branchId: 302,
    orderDate: new Date("2026-05-11T09:15:00Z"),
    totalAmount: 89.90,
    status: "pending",
    createdAt: new Date("2026-05-11T09:15:00Z"),
    updatedAt: new Date("2026-05-11T09:15:00Z")
});

salesDb.orderLines.insertMany([
    {
        lineId: "LINE-1002-1", orderId: "ORD-1002", tenant_id: 1, productId: 5010,
        quantity: 3, unitPrice: 29.99, discount: 0.07, cost: 15.00, taxRate: 0.19,
        eventType: "created", timestamp: new Date("2026-05-11T09:15:10Z"), seq: 1
    }
]);

salesDb.orders.insertOne({
    orderId: "ORD-2001",
    tenant_id: 2,
    customerId: 20001,
    employeeId: 4001,
    paymentMethodId: 3,
    branchId: 601,
    orderDate: new Date("2026-05-09T15:45:00Z"),
    totalAmount: 3500.00,
    status: "completed",
    createdAt: new Date("2026-05-09T15:45:00Z"),
    updatedAt: new Date("2026-05-09T15:46:00Z")
});

salesDb.orderLines.insertMany([
    {
        lineId: "LINE-2001-1", orderId: "ORD-2001", tenant_id: 2, productId: 7001,
        quantity: 5, unitPrice: 700.00, discount: 0, cost: 500.00, taxRate: 0.19,
        eventType: "created", timestamp: new Date("2026-05-09T15:45:05Z"), seq: 1
    },
    {
        lineId: "LINE-2001-1", orderId: "ORD-2001", tenant_id: 2, productId: 7001,
        quantity: 5, unitPrice: 700.00, discount: 0, cost: 500.00, taxRate: 0.19,
        eventType: "paid", timestamp: new Date("2026-05-09T15:46:00Z"), seq: 2
    },
    {
        lineId: "LINE-2001-2", orderId: "ORD-2001", tenant_id: 2, productId: 7002,
        quantity: 1, unitPrice: 0, discount: 0, cost: 0, taxRate: 0,
        eventType: "created", timestamp: new Date("2026-05-09T15:45:06Z"), seq: 1
    }
]);

print("sales_database inicializada correctamente.");
print("Colecciones: orders, orderLines");
print("Tenants: 1, 2");
