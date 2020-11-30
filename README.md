# Building plan viewer

Software system for viewing DXF CAD files in a web interface.

## Getting started

### Requirements

You need to have the Java Development Kit (JDK) 15 installed.

### Building the application

There are multiple ways to build and deploy the application.
Regardless, by default the web app will run at port `8080`, which is configurable using the command line option `--server.port 80`.

#### Bootable JAR

In order to build a bootable jar, you'll have to run `gradlew.bat bootJar` (Windows) or `gradlew bootJar` (Linux).
You'll find the built JAR file at `/server/build/libs`.
Execute the application using `java -jar server/build/libs/server-0.0.1-SNAPSHOT.jar`.

You may change the port (or apply other Spring Boot supported settings) by calling `java -jar .\server\build\libs\server-0.0.1-SNAPSHOT.jar --server.port=80` or the equivalent syntax `java -jar -Dserver.port=80 .\server\build\libs\server-0.0.1-SNAPSHOT.jar`

#### Docker image

You may as well build a Docker image using `gradlew.bat bootBuildImage`.
Afterwards you'll find the image under the name `building-plan-viewer` when running `docker image list`.
Deploy the container by using for example `docker run --name viewer -p 8080:8080 --rm building-plan-viewer:0.1.0` (Make sure the version is correct by running `docker image list` beforehand).
Stop the container by running `docker container stop viewer`
