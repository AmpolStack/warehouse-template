FROM debezium/connect:2.7.3.Final

USER root

COPY confluentinc-kafka-connect-s3-12.1.4.zip /tmp/kafka-connect-s3.zip

RUN mkdir -p /kafka/connect/kafka-connect-s3 \
    && unzip /tmp/kafka-connect-s3.zip -d /kafka/connect/kafka-connect-s3 \
    && rm /tmp/kafka-connect-s3.zip

USER 1001