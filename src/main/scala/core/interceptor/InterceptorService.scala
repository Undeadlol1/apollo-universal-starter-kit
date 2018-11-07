package core.interceptor

import common.Logger
import core.guice.injection.Injecting.injector
import javax.inject.Inject
import org.aopalliance.intercept.{MethodInterceptor, MethodInvocation}

import scala.concurrent.Await
import scala.concurrent.duration.Duration.Inf

class InterceptorService @Inject() extends MethodInterceptor with Logger {
  override def invoke(invocation: MethodInvocation): AnyRef = {
    val classesAndArgs = invocation.getMethod.getParameterAnnotations.flatMap(_.zipWithIndex.flatMap {
      case (annotation, index) =>
        annotation.asInstanceOf[InterceptorArg].classes.flatMap {
          clazz =>
            List[(Class[_], Int)]((clazz, index))
        }
    }).toList
    val args = invocation.getArguments
    for (classAndArg <- classesAndArgs) {
      val clazz = classAndArg._1
      val argIndex = classAndArg._2
      log.debug(s"Handle $clazz with argument index $argIndex")
      Await.ready(
        injector.getInstance(clazz).asInstanceOf[Interceptor[AnyRef, AnyRef]].handle(args(argIndex)),
        Inf
      ).value.get.get match {
        case Left(error) =>
          log.debug(s"Handled with error: $error")
          return error
        case Right(value) =>
          log.debug(s"Handled with value: $value")
          value.foreach(args(argIndex) = _)
      }
    }
    log.debug(s"Proceed to the next interceptor in the chain")
    invocation.proceed()
  }
}