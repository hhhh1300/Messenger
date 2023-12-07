'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
// import { publicEnv } from "@/lib/env/public";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils/shadcn";

export default function AuthForm() {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  
  
  const handleSubmit = () => {
    signIn("credentials", {
      email,
      username,
      password,
      image,
      callbackUrl: `/chats`,
    });
  }
  
  return (
    <>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              {isSignUp && 
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">email</Label>
                  <Input 
                    id="email" 
                    placeholder="email" 
                    type="email" value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
              }
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">username</Label>
                <Input 
                  id="username" 
                  placeholder="Username" 
                  type="text" value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div> 
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">password</Label>
                <Input 
                  id="password" 
                  placeholder="Password" 
                  type="password" value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              {isSignUp &&
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="confirmPassword">confirm password</Label>
                  <Input 
                    id="confirmPassword" 
                    placeholder="confirm password" 
                    type="password" value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />
                </div> 
              }
              {isSignUp &&
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="image">avatar source</Label>
                  <Input 
                    id="image" 
                    placeholder="avatar source" 
                    type="text" value={image} 
                    onChange={(e) => setImage(e.target.value)} 
                  />
                </div> 
              }
              <div className="text-gray-500 text-sm">
                {isSignUp ?
                  <span>
                    {"Already have an account? "}
                    <a
                      className="cursor-pointer hover:underline"
                      onClick={() => setIsSignUp(false)}
                      >
                      Sign In
                    </a>
                  </span> :
                  <span>
                    {"Do not have an account? "}
                    <a
                      className="cursor-pointer hover:underline"
                      onClick={() => setIsSignUp(true)}
                      >
                      Sign Up
                    </a>
                  </span>
                }
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="mb-2 w-full">
            <div className={cn("w-full")}>
              <Button className={cn("w-full")} onClick={handleSubmit}>Submit</Button>
            </div>

            <div className="flex w-full items-center gap-1 py-2">
              <div className="h-[1px] grow border-t"></div>
              <p className="text-xs text-gray-400">or</p>
              <div className="h-[1px] grow border-t"></div>
            </div>
            
            <Button
              onClick={async () => {
                // TODO: sign in with github
                signIn("github", {
                  callbackUrl: `/chats`,
                });
              }}
              className="flex w-full"
              variant={"outline"}
              >
              {/* Remember to copy "github.png" to ./public folder */}
              <Image src="/github.png" alt="github icon" width={20} height={20} />
              <span className="grow">Sign In with Github</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}