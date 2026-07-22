import { UseGuards } from "@nestjs/common";
import { Query, Resolver, ObjectType, Field, ID } from "@nestjs/graphql";
import { GqlAuthGuard } from "./gql-auth.guard";
import { CurrentUser, type AuthUser } from "./auth.types";

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  emailVerified!: boolean;

  @Field(() => String, { nullable: true })
  image?: string | null;
}

@Resolver(() => UserModel)
export class AuthResolver {
  @Query(() => UserModel, {
    description: "Returns the currently authenticated user",
  })
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: AuthUser): UserModel {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
    };
  }
}
